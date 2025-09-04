const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174','https://prowolo-backoffice.netlify.app','https://prowolo-technician.netlify.app',"http://localhost:8081"], // Local
  // origin: ['https://prowolo-backoffice.netlify.app','https://prowolo-technician.netlify.app'], // Production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // Allowed headers
  credentials: true, // Allow credentials like cookies if needed
  optionsSuccessStatus: 200, // Fixes preflight issues with older browsers
};

export default corsOptions;
