
import handler from "./api/generate-plan.js";

const mockReq = {
  method: "POST",
  headers: {
    "x-forwarded-host": "localhost",
    "origin": "http://localhost:5173",
    "content-type": "application/json",
    "x-real-ip": "127.0.0.1"
  },
  body: {
    mode: "adjustMeal",
    targetProfile: "el",
    elData: {
      perfilEL: {
        id: "el",
        nombre: "Test User",
        perfil: "90 kg | 1.80 m | 30 anos",
        detallesPerfil: "Hombre, Sedentario",
        meta: "Pérdida de grasa",
        horariosTexto: "2 comidas al día",
        notaSalud: "Ninguna",
        clinicalPortionsGrid: {
          "desayuno": {"Cereal": 2, "Proteína": 2, "Grasa": 1, "Verdura": 1, "Fruta": 1},
          "comida": {"Cereal": 2, "Proteína": 3, "Grasa": 2, "Verdura": 2, "Fruta": 0}
        },
        momentos: [
          { key: "desayuno", label: "Desayuno", horario: "08:00" },
          { key: "comida", label: "Comida", horario: "14:00" }
        ]
      }
    },
    mealDetails: {
      action: "REPLACE",
      day: "Lunes",
      momentoIndex: 0,
      oldMeals: []
    }
  }
};

const mockRes = {
  status: function(code) { this.statusCode = code; return this; },
  json: function(data) { console.log(JSON.stringify(data, null, 2)); return this; },
  setHeader: function() { return this; }
};

handler(mockReq, mockRes).catch(console.error);

