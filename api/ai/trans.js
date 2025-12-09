// Fonction pour traduire un texte via LibreTranslate
async function traduire(text, lang) {
    try {
        const response = await fetch("https://libretranslate.de/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: text,
                source: "auto", // détecte automatiquement la langue du texte
                target: lang,
                format: "text"
            })
        });

        const data = await response.json();
        return data.translatedText;
    } catch (err) {
        console.error("Erreur de traduction :", err);
        return null;
    }
}

// Exemple d'utilisation
(async () => {
    const texte = "Bonjour, comment ça va ?";
    const langue = "en"; // anglais
    const traduction = await traduire(texte, langue);
    console.log("Traduction :", traduction);
})();