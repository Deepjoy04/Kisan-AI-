import numpy as np
from PIL import Image
import io
import logging
import asyncio
from pathlib import Path

logger = logging.getLogger(__name__)

# Model configuration
MODEL_PATH = Path(__file__).parent.parent / "models" / "plant_disease_model_v2.keras"
IMAGE_SIZE = (224, 224)

# Lazy-loaded model singleton
_model = None

def _load_model():
    """Load the Keras model once and cache it"""
    global _model
    if _model is not None:
        return _model

    try:
        import tensorflow as tf
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        _model = tf.keras.models.load_model(str(MODEL_PATH))
        logger.info(f"✓ Loaded disease detection model from {MODEL_PATH.name}")
        logger.info(f"  Input shape: {_model.input_shape}, Output classes: {_model.output_shape[-1]}")
        return _model
    except ImportError:
        logger.error("TensorFlow not installed. Run: pip install tensorflow")
        raise RuntimeError("TensorFlow is required for disease detection. Install it with: pip install tensorflow")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise RuntimeError(f"Failed to load disease detection model: {str(e)}")


# Plant disease classes — order must match the model's training labels
# This mapping covers the 38 classes from the PlantVillage dataset
DISEASE_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

_SUPPORTED_CROPS = sorted({label.split("___")[0].replace("_", " ").lower() for label in DISEASE_CLASSES})
_UNSUPPORTED_STAPLE_HINTS = {"rice", "wheat"}

# Treatment database keyed by class label
TREATMENT_DATABASE = {
    "Apple___Apple_scab": {
        "cause": "Fungal infection (Venturia inaequalis)",
        "symptoms": ["Olive-green spots on leaves", "Scabby fruit lesions", "Premature leaf drop"],
        "treatment": ["Apply fungicide (Mancozeb or Captan)", "Prune infected branches", "Remove fallen leaves"],
        "prevention": ["Plant resistant varieties", "Ensure good air circulation", "Apply preventive sprays in spring"],
        "products": ["Mancozeb 75% WP", "Captan 50% WP", "Myclobutanil"],
        "urgency": "Within a week"
    },
    "Apple___Black_rot": {
        "cause": "Fungal infection (Botryosphaeria obtusa)",
        "symptoms": ["Brown spots with concentric rings", "Fruit mummification", "Cankers on branches"],
        "treatment": ["Remove mummified fruit", "Prune cankers", "Apply copper-based fungicide"],
        "prevention": ["Remove dead wood", "Maintain tree hygiene", "Apply dormant sprays"],
        "products": ["Copper oxychloride", "Captan", "Thiophanate-methyl"],
        "urgency": "Immediate"
    },
    "Apple___Cedar_apple_rust": {
        "cause": "Fungal infection (Gymnosporangium juniperi-virginianae)",
        "symptoms": ["Yellow-orange spots on leaves", "Tube-like structures under leaves"],
        "treatment": ["Apply fungicide at bud break", "Remove nearby cedar trees if possible"],
        "prevention": ["Plant resistant varieties", "Remove alternate hosts", "Apply preventive fungicide"],
        "products": ["Mancozeb", "Myclobutanil", "Triadimefon"],
        "urgency": "Within a week"
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "cause": "Fungal infection (Podosphaera clandestina)",
        "symptoms": ["White powdery coating on leaves", "Leaf curling", "Stunted growth"],
        "treatment": ["Spray sulfur or neem oil", "Remove severely infected leaves", "Improve air circulation"],
        "prevention": ["Avoid overhead watering", "Space plants properly", "Apply preventive sprays"],
        "products": ["Sulfur 80% WP", "Neem oil", "Potassium bicarbonate"],
        "urgency": "Within a week"
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "cause": "Fungal infection (Cercospora zeae-maydis)",
        "symptoms": ["Rectangular gray-tan lesions", "Lesions parallel to leaf veins"],
        "treatment": ["Apply foliar fungicide", "Remove crop residue after harvest"],
        "prevention": ["Rotate crops", "Plant resistant hybrids", "Reduce planting density"],
        "products": ["Mancozeb", "Propiconazole", "Azoxystrobin"],
        "urgency": "Within a week"
    },
    "Corn_(maize)___Common_rust_": {
        "cause": "Fungal infection (Puccinia sorghi)",
        "symptoms": ["Small reddish-brown pustules on both leaf surfaces", "Leaves turning yellow"],
        "treatment": ["Apply fungicide early", "Remove infected plant debris"],
        "prevention": ["Plant resistant varieties", "Early planting", "Avoid overhead irrigation"],
        "products": ["Mancozeb", "Propiconazole", "Tebuconazole"],
        "urgency": "Immediate"
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "cause": "Fungal infection (Exserohilum turcicum)",
        "symptoms": ["Long cigar-shaped gray-green lesions", "Lesions turning tan as they mature"],
        "treatment": ["Apply foliar fungicide at first sign", "Remove crop residue"],
        "prevention": ["Crop rotation", "Plant resistant hybrids", "Tillage to bury residue"],
        "products": ["Mancozeb 75% WP", "Azoxystrobin", "Propiconazole"],
        "urgency": "Immediate"
    },
    "Grape___Black_rot": {
        "cause": "Fungal infection (Guignardia bidwellii)",
        "symptoms": ["Brown circular lesions on leaves", "Black shriveled fruit (mummies)"],
        "treatment": ["Remove mummified berries", "Apply fungicide at bloom", "Prune for air circulation"],
        "prevention": ["Remove infected material", "Ensure good canopy management", "Spray preventively"],
        "products": ["Mancozeb", "Myclobutanil", "Captan"],
        "urgency": "Immediate"
    },
    "Grape___Esca_(Black_Measles)": {
        "cause": "Fungal complex (Phaeomoniella, Phaeoacremonium)",
        "symptoms": ["Tiger-stripe pattern on leaves", "Dark berry spots", "Wood decay"],
        "treatment": ["Remove severely affected vines", "Apply wound protectants after pruning"],
        "prevention": ["Avoid large pruning wounds", "Use clean pruning tools", "Apply wound sealant"],
        "products": ["Trichoderma-based products", "Copper oxychloride"],
        "urgency": "Within a week"
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "cause": "Fungal infection (Pseudocercospora vitis)",
        "symptoms": ["Dark brown irregular spots", "Yellow halo around spots", "Premature defoliation"],
        "treatment": ["Apply fungicide spray", "Remove fallen leaves", "Improve canopy ventilation"],
        "prevention": ["Proper canopy management", "Avoid overhead irrigation", "Remove leaf litter"],
        "products": ["Mancozeb", "Copper oxychloride", "Carbendazim"],
        "urgency": "Within a week"
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "cause": "Bacterial infection (Candidatus Liberibacter)",
        "symptoms": ["Blotchy mottled leaves", "Lopsided bitter fruit", "Yellow shoots"],
        "treatment": ["Remove and destroy infected trees", "Control psyllid vectors", "Nutritional sprays"],
        "prevention": ["Use disease-free nursery stock", "Control Asian citrus psyllid", "Regular scouting"],
        "products": ["Imidacloprid (for psyllid control)", "Nutritional sprays"],
        "urgency": "Immediate"
    },
    "Peach___Bacterial_spot": {
        "cause": "Bacterial infection (Xanthomonas arboricola)",
        "symptoms": ["Small dark spots on leaves", "Fruit cracking", "Premature leaf drop"],
        "treatment": ["Apply copper-based bactericide", "Prune infected branches"],
        "prevention": ["Plant resistant varieties", "Avoid overhead irrigation", "Good orchard sanitation"],
        "products": ["Copper oxychloride", "Streptocycline", "Oxytetracycline"],
        "urgency": "Immediate"
    },
    "Pepper,_bell___Bacterial_spot": {
        "cause": "Bacterial infection (Xanthomonas campestris)",
        "symptoms": ["Small water-soaked spots", "Raised corky spots on fruit", "Leaf yellowing"],
        "treatment": ["Apply copper spray", "Remove infected plants", "Avoid working with wet plants"],
        "prevention": ["Use certified disease-free seeds", "Crop rotation", "Avoid overhead watering"],
        "products": ["Copper oxychloride", "Streptocycline", "Kasugamycin"],
        "urgency": "Immediate"
    },
    "Potato___Early_blight": {
        "cause": "Fungal infection (Alternaria solani)",
        "symptoms": ["Dark concentric ring spots on lower leaves", "Yellowing around spots"],
        "treatment": ["Remove lower infected leaves", "Apply fungicide (Mancozeb)", "Stake plants for airflow"],
        "prevention": ["Remove leaf litter", "Mulch soil", "Plant resistant varieties"],
        "products": ["Mancozeb 75% WP", "Chlorothalonil", "Azoxystrobin"],
        "urgency": "Immediate"
    },
    "Potato___Late_blight": {
        "cause": "Fungal infection (Phytophthora infestans)",
        "symptoms": ["Water-soaked lesions", "White mold on leaf underside", "Rapid plant death"],
        "treatment": ["Apply systemic fungicide immediately", "Remove infected parts", "Improve drainage"],
        "prevention": ["Plant resistant varieties", "Avoid overhead watering", "Spray preventively in humid season"],
        "products": ["Metalaxyl-M", "Cymoxanil", "Mancozeb"],
        "urgency": "Immediate"
    },
    "Squash___Powdery_mildew": {
        "cause": "Fungal infection (Podosphaera xanthii)",
        "symptoms": ["White powdery spots on leaves", "Leaf yellowing", "Reduced fruit quality"],
        "treatment": ["Spray sulfur or neem oil", "Remove infected leaves", "Increase plant spacing"],
        "prevention": ["Plant resistant varieties", "Avoid overhead watering", "Good air circulation"],
        "products": ["Sulfur 80% WP", "Neem oil", "Potassium bicarbonate"],
        "urgency": "Within a week"
    },
    "Strawberry___Leaf_scorch": {
        "cause": "Fungal infection (Diplocarpon earlianum)",
        "symptoms": ["Purple-red spots on leaves", "Leaf margins dry and scorch", "Reduced fruit yield"],
        "treatment": ["Remove infected leaves", "Apply fungicide", "Renovate beds after harvest"],
        "prevention": ["Plant resistant varieties", "Adequate spacing", "Drip irrigation"],
        "products": ["Captan", "Mancozeb", "Copper oxychloride"],
        "urgency": "Within a week"
    },
    "Tomato___Bacterial_spot": {
        "cause": "Bacterial infection (Xanthomonas spp.)",
        "symptoms": ["Yellow halos around dark spots", "Water-soaked spots on fruit"],
        "treatment": ["Apply copper-based bactericide", "Remove infected branches", "Disinfect tools"],
        "prevention": ["Use disease-free seeds", "Avoid overhead watering", "Plant resistant varieties"],
        "products": ["Copper oxychloride", "Streptocycline", "Kasugamycin"],
        "urgency": "Immediate"
    },
    "Tomato___Early_blight": {
        "cause": "Fungal infection (Alternaria solani)",
        "symptoms": ["Lower leaf spots with concentric rings", "Yellowing around spots"],
        "treatment": ["Remove lower leaves", "Apply fungicide (Mancozeb)", "Stake plants for airflow"],
        "prevention": ["Remove leaf litter", "Mulch soil", "Plant resistant varieties"],
        "products": ["Mancozeb 75% WP", "Chlorothalonil", "Bacillus subtilis"],
        "urgency": "Immediate"
    },
    "Tomato___Late_blight": {
        "cause": "Fungal infection (Phytophthora infestans)",
        "symptoms": ["Water-soaked lesions", "White mold on leaf underside", "Rapid wilting"],
        "treatment": ["Apply systemic fungicide immediately", "Remove infected parts", "Improve drainage"],
        "prevention": ["Plant resistant varieties", "Avoid overhead watering", "Spray preventively in humid season"],
        "products": ["Metalaxyl-M", "Cymoxanil", "Mancozeb"],
        "urgency": "Immediate"
    },
    "Tomato___Leaf_Mold": {
        "cause": "Fungal infection (Passalora fulva)",
        "symptoms": ["Yellow patches on upper leaf", "Olive-green mold below", "Leaf curling"],
        "treatment": ["Improve ventilation", "Apply fungicide", "Remove infected leaves"],
        "prevention": ["Reduce humidity in greenhouse", "Space plants properly", "Resistant varieties"],
        "products": ["Mancozeb", "Chlorothalonil", "Copper oxychloride"],
        "urgency": "Within a week"
    },
    "Tomato___Septoria_leaf_spot": {
        "cause": "Fungal infection (Septoria lycopersici)",
        "symptoms": ["Small circular spots with gray centers", "Dark borders", "Lower leaves affected first"],
        "treatment": ["Remove affected leaves", "Apply copper fungicide", "Reduce humidity"],
        "prevention": ["Destroy infected plant debris", "Avoid wetting foliage", "Space plants properly"],
        "products": ["Copper oxychloride", "Chlorothalonil", "Mancozeb"],
        "urgency": "Within a week"
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "cause": "Pest infestation (Tetranychus urticae)",
        "symptoms": ["Fine webbing on leaves", "Yellow stippling", "Leaf bronzing"],
        "treatment": ["Spray miticide or neem oil", "Increase humidity", "Introduce predatory mites"],
        "prevention": ["Regular scouting", "Avoid dusty conditions", "Maintain plant health"],
        "products": ["Neem oil", "Abamectin", "Spiromesifen"],
        "urgency": "Immediate"
    },
    "Tomato___Target_Spot": {
        "cause": "Fungal infection (Corynespora cassiicola)",
        "symptoms": ["Concentric ring spots", "Brown lesions", "Premature defoliation"],
        "treatment": ["Apply fungicide spray", "Remove lower infected leaves", "Prune dense canopy"],
        "prevention": ["Mulch soil", "Avoid overhead watering", "Clean tools between plants"],
        "products": ["Mancozeb", "Chlorothalonil", "Azoxystrobin"],
        "urgency": "Immediate"
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "cause": "Viral infection (transmitted by whiteflies)",
        "symptoms": ["Upward leaf curling", "Yellowing of leaf margins", "Stunted growth"],
        "treatment": ["Remove infected plants", "Control whitefly population", "No chemical cure for virus"],
        "prevention": ["Use resistant varieties", "Install insect-proof nets", "Control whiteflies early"],
        "products": ["Imidacloprid (for whiteflies)", "Yellow sticky traps", "Neem oil"],
        "urgency": "Immediate"
    },
    "Tomato___Tomato_mosaic_virus": {
        "cause": "Viral infection (ToMV)",
        "symptoms": ["Mottled light/dark green leaves", "Leaf distortion", "Reduced fruit set"],
        "treatment": ["Remove and destroy infected plants", "Disinfect hands and tools", "No chemical cure"],
        "prevention": ["Use virus-free seeds", "Wash hands before handling", "Avoid tobacco products near plants"],
        "products": ["No effective chemical treatment", "Milk spray (10%) as preventive"],
        "urgency": "Immediate"
    },
}


def _parse_class_label(label: str) -> dict:
    """Parse a class label like 'Tomato___Early_blight' into crop name and disease"""
    parts = label.split("___")
    crop = parts[0].replace("_", " ").replace(",", ",")
    disease = parts[1].replace("_", " ").strip() if len(parts) > 1 else "Unknown"

    # Clean up crop names
    crop = crop.replace("  ", " ")
    is_healthy = disease.lower() == "healthy"

    return {
        "crop_name": crop,
        "disease": "Healthy" if is_healthy else disease,
        "is_healthy": is_healthy,
    }


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convert image bytes to preprocessed array"""
    try:
        # Open image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # Resize to model input size
        image = image.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)

        # Convert to array (keep raw 0-255 values — the model has internal rescaling layers)
        image_array = np.array(image, dtype=np.float32)

        # Add batch dimension: (224, 224, 3) → (1, 224, 224, 3)
        image_array = np.expand_dims(image_array, axis=0)

        return image_array
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise ValueError(f"Failed to process image: {str(e)}")


from typing import Optional

async def analyze_crop_image_local(image_bytes: bytes, crop_hint: Optional[str] = None) -> dict:
    """Analyze crop image using the trained Keras model"""
    try:
        hint_lower = (crop_hint or "").strip().lower()
        if hint_lower in _UNSUPPORTED_STAPLE_HINTS:
            crop_display = hint_lower.title()
            return {
                "crop_name": crop_display,
                "disease": "Unsupported by current model",
                "is_healthy": False,
                "confidence": "Low",
                "confidence_score": 0.0,
                "symptoms": ["Model coverage does not include this crop"],
                "cause": "Unknown",
                "treatment": [
                    "Upload a clearer image and consult a local agronomist for confirmation",
                    "Use KisanAI Chat/Soil advisor for crop-specific guidance",
                ],
                "prevention": ["Model retraining with rice/wheat datasets is required for reliable diagnosis"],
                "products": ["Consult local agriculture extension center"],
                "urgency": "Monitor",
                "model_info": "Keras CNN — PlantVillage Dataset (38 classes)",
                "coverage_warning": "This model currently does not support Rice or Wheat disease detection.",
                "supported_crops": _SUPPORTED_CROPS,
            }

        # Load model (cached after first call)
        model = _load_model()

        # Preprocess image
        image_array = preprocess_image(image_bytes)

        # Run TensorFlow predict in a thread so async request handling stays responsive.
        loop = asyncio.get_running_loop()
        prediction_batch = await loop.run_in_executor(
            None,
            lambda: model.predict(image_array, verbose=0),
        )
        predictions = prediction_batch[0]
        
        # Filter by crop_hint if provided
        if hint_lower:
            for i, class_name in enumerate(DISEASE_CLASSES):
                plant_part = class_name.split('___')[0].lower()
                if hint_lower not in plant_part:
                    predictions[i] = -float('inf')  # Mask out disallowed crops
        
        # Get top predicted index
        predicted_index = int(np.argmax(predictions))
        predicted_class = DISEASE_CLASSES[predicted_index]
        confidence_score = float(predictions[predicted_index])

        # Map index to class label
        if predicted_index < len(DISEASE_CLASSES):
            class_label = predicted_class
        else:
            logger.warning(f"Predicted class index {predicted_index} out of range, defaulting to Tomato___healthy")
            class_label = "Tomato___healthy"

        # Parse the label
        info = _parse_class_label(class_label)

        # Get treatment details (fall back to generic healthy info)
        treatment_info = TREATMENT_DATABASE.get(class_label, {})

        # Determine confidence level
        if confidence_score >= 0.8:
            confidence = "High"
        elif confidence_score >= 0.6:
            confidence = "Medium"
        else:
            confidence = "Low"

        # Build response
        result = {
            "crop_name": info["crop_name"],
            "disease": info["disease"],
            "is_healthy": info["is_healthy"],
            "confidence": confidence,
            "confidence_score": round(confidence_score, 3),
            "symptoms": treatment_info.get("symptoms", ["See a local agronomist for detailed symptoms"]),
            "cause": treatment_info.get("cause", "Unknown"),
            "treatment": treatment_info.get("treatment", ["Consult a local agricultural officer"]),
            "prevention": treatment_info.get("prevention", ["Maintain crop hygiene", "Regular monitoring"]),
            "products": treatment_info.get("products", ["Consult local agri-shop"]),
            "urgency": treatment_info.get("urgency", "Monitor"),
            "model_info": "Keras CNN — PlantVillage Dataset",
            "coverage_warning": "Model covers PlantVillage classes and does not include Rice/Wheat.",
            "supported_crops": _SUPPORTED_CROPS,
        }

        logger.info(f"✓ Prediction: {class_label} (confidence: {confidence_score:.2%})")
        return result

    except RuntimeError:
        raise  # Re-raise model loading errors
    except Exception as e:
        logger.error(f"Error analyzing crop image with local model: {e}")
        raise ValueError(f"Failed to analyze crop image: {str(e)}")
