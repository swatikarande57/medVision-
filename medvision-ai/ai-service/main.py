from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/predict")
async def predict():
    return {"prediction": "dummy"}
