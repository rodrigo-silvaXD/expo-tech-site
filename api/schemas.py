from pydantic import BaseModel, Field
from typing import List, Literal


class LeituraIn(BaseModel):
    peopleCount: int = Field(
        ..., ge=0, le=10,
        description="Número de pessoas na sala (sensor de contagem)",
    )
    temperature: float = Field(
        ..., ge=16, le=40,
        description="Temperatura em graus Celsius (DHT11)",
    )
    lightStatus: Literal["ON", "OFF"] = Field(
        ..., description="Estado da iluminação",
    )
    acStatus: Literal["OFF", "LOW", "HIGH"] = Field(
        ..., description="Estado do ar-condicionado",
    )
    consumption: int = Field(
        ..., ge=0, le=1700,
        description="Consumo medido em watts",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "peopleCount":  3,
                    "temperature":  25.4,
                    "lightStatus":  "ON",
                    "acStatus":     "LOW",
                    "consumption":  900,
                }
            ]
        }
    }


class LeituraOut(BaseModel):
    ok:             bool
    total_readings: int  = Field(..., description="Total acumulado de leituras")
    anomaly_score:  float = Field(..., description="Score de anomalia em %")
    anomaly_flag:   bool  = Field(..., description="True se o score > 40%")


class PrevisaoOut(BaseModel):
    predicted_consumption_w: int
    baseline_w:              int
    predicted_saving_pct:    float
    coef_people:             float
    coef_temp:               float
    training_samples:        int
    model_type:              str = "LinearRegression"
    features:                List[str] = ["people_count", "temperature"]


class LeituraRecente(BaseModel):
    ts:          str
    people:      int
    temperature: float
    ac:          str
    consumption: int


class EstatisticasOut(BaseModel):
    total_readings:    int
    avg_consumption_w: int
    max_consumption_w: int
    avg_saved_pct:     float
    page:              int
    limit:             int
    total_pages:       int
    recent:            List[LeituraRecente]


class HealthOut(BaseModel):
    status:           str
    model_trained:    bool
    training_samples: int
