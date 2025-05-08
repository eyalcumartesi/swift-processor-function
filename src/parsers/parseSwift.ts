// Actualizar en src/parsers/parseSwift.ts
interface MessageData {
	senderSwift: string;
	accountNumber: string;
	currency: string;
	availableBalance?: number;
	// Añadir campos adicionales para formato PRT si es necesario
	transactionDate?: string;
	referenceNumber?: string;
}

export function parseSWIFTFile(
	fileContent: string,
	format: string = "standard"
): MessageData[] {
	// Detectar si el archivo está en formato PRT
	const isPrtFormat =
		format === "prt" ||
		fileContent.includes("PRT FORMAT") ||
		/^[0-9]{2}(PRT|prt)/.test(fileContent);

	let messages: string[];

	if (isPrtFormat) {
		// Lógica específica para parsear formato PRT
		messages = fileContent.split(/\r?\n\r?\n/).filter((msg) => msg.trim());
	} else {
		// Tu lógica existente para otros formatos
		messages = fileContent.split(/_{4,}/).filter((msg) => msg.trim());
	}

	const parsedMessages: MessageData[] = [];

	messages.forEach((msg) => {
		// Para formato PRT, usamos patrones de extracción diferentes
		if (isPrtFormat) {
			const senderMatch = msg.match(/:(SENDER|FROM):([A-Z0-9]+)/i);
			const accountMatch = msg.match(/:(ACCOUNT|ACCT):([A-Z0-9]+)/i);
			const currencyMatch = msg.match(/:(CCY|CURRENCY):([A-Z]{3})/i);
			const balanceMatch = msg.match(/:(BALANCE|BAL):([0-9,.]+)/i);

			if (!senderMatch || !accountMatch || !currencyMatch) return;

			parsedMessages.push({
				senderSwift: senderMatch[2],
				accountNumber: accountMatch[2],
				currency: currencyMatch[2],
				availableBalance: balanceMatch
					? parseFloat(balanceMatch[2].replace(/,/g, ""))
					: undefined,
			});
		} else {
			const senderMatch = msg.match(/Sender\s*:\s*(\w+)/);
			if (!senderMatch) return;

			const accountMatch = msg.match(
				/25:\s*Account Identification\s*\n\s*([^\n]+)/
			);
			if (!accountMatch) return;

			const currencyMatch = msg.match(/Currency\s*:\s*(\w+)\s*\([^)]+\)/);
			if (!currencyMatch) return;

			const availableBalanceMatch = msg.match(/64:[^#]+#([\d,\.]+)#/);
			const availableBalanceMatch63F = msg.match(/62F:[^#]+#([\d,\.]+)#/);

			parsedMessages.push({
				senderSwift: senderMatch[1],
				accountNumber: accountMatch[1].split(" ")[0].trim(),
				currency: currencyMatch[1],
				availableBalance: availableBalanceMatch
					? parseFloat(availableBalanceMatch[1].replace(/,/g, ""))
					: availableBalanceMatch63F
					? parseFloat(availableBalanceMatch63F[1].replace(/,/g, ""))
					: undefined,
			});
		}
	});

	return parsedMessages;
}
