interface MessageData {
	senderSwift: string;
	accountNumber: string;
	currency: string;
	availableBalance?: number;
}

export function parseSWIFTFile(fileContent: string): MessageData[] {
	const messages = fileContent.split(/_{4,}/).filter((msg) => msg.trim());
	const parsedMessages: MessageData[] = [];

	messages.forEach((msg) => {
		// Extract sender SWIFT code
		const senderMatch = msg.match(/Sender\s*:\s*(\w+)/);
		if (!senderMatch) return;

		// Extract account number
		const accountMatch = msg.match(
			/25:\s*Account Identification\s*\n\s*([^\n]+)/
		);
		if (!accountMatch) return;

		// Extract currency
		const currencyMatch = msg.match(/Currency\s*:\s*(\w+)\s*\([^)]+\)/);
		if (!currencyMatch) return;

		// Extract field 64 (available balance)
		const availableBalanceMatch = msg.match(/64:[^#]+#([\d,\.]+)#/);
		const availableBalanceMatch63F = msg.match(/62F:[^#]+#([\d,\.]+)#/);

		if (!availableBalanceMatch && !availableBalanceMatch63F) return;

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
	});

	return parsedMessages;
}
