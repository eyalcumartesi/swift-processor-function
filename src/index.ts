import * as express from "express";
import * as cors from "cors";
import * as multer from "multer";
import * as path from "path";
import * as fs from "fs";
import parseSWIFTFile from "./parseSwift";

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS para permitir peticiones desde Power Automate
app.use(cors());
app.use(express.json());

// Configuración de multer para manejar los archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint para recibir el archivo SWIFT
app.post("/api/process-swift", upload.single("file"), (req, res) => {
	try {
		if (!req.file) {
			res.status(400).json({ error: "No se ha recibido ningún archivo" });
			return;
		}

		// Leer el contenido del archivo
		const fileContent = req.file.buffer.toString("utf-8");

		// Comprobar si el formato debe ser PRT o standard basado en el nombre o contenido
		const isPrtFormat =
			req.file.originalname.toLowerCase().includes("prt") ||
			fileContent.includes("PRT FORMAT");

		// Procesar el archivo con la función existente
		const format = isPrtFormat ? "prt" : "standard";
		const result = parseSWIFTFile(fileContent, format);

		// Guardar una copia del archivo recibido para debugging (opcional)
		const uploadDir = path.join(__dirname, "../uploads");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		fs.writeFileSync(
			path.join(uploadDir, `${Date.now()}-${req.file.originalname}`),
			fileContent
		);

		// Devolver el JSON con la información extraída
		res.json({
			success: true,
			data: result,
			message: `Procesado ${result.length} mensajes SWIFT`,
		});
	} catch (error: any) {
		console.error("Error al procesar el archivo:", error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
});

// Endpoint simple para verificar que el servidor está funcionando
app.get("/", (req, res) => {
	res.send("API de procesamiento SWIFT está activa");
});

// Iniciar el servidor
app.listen(port, () => {
	console.log(`Servidor escuchando en http://localhost:${port}`);
});
