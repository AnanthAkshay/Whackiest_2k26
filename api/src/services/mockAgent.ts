import type { Language } from "../types";

const questions: Record<Language, string[]> = {
  en: [
    "I am new to Excel. What is a worksheet, and how do sheet tabs help me move around a workbook?",
    "If A1 has 10 and I copy a formula from B1 to B2, why might the cell reference change? What does $A$1 mean?",
    "Could you show me a small numbers example using SUM or AVERAGE, starting with the equals sign?",
    "How would you show the same number as money, a percentage, or a date? Why does the number format matter?",
    "What makes an Excel table useful? Please explain headers, sorting, filtering, and a totals row."
  ],
  hi: [
    "मैं Excel में नया हूँ। worksheet क्या है, और sheet tabs से workbook में कैसे घूमते हैं?",
    "अगर A1 में 10 है और मैं B1 का formula B2 में कॉपी करूँ, तो cell reference क्यों बदल सकता है? $A$1 का क्या मतलब है?",
    "क्या आप equals sign से शुरू करके SUM या AVERAGE का छोटे अंकों वाला उदाहरण बता सकते हैं?",
    "एक ही number को पैसे, प्रतिशत या तारीख के रूप में कैसे दिखाएँगे? number format क्यों ज़रूरी है?",
    "Excel table किस काम आता है? headers, sorting, filtering और totals row समझाइए।"
  ],
  kn: [
    "ನಾನು Excel ಗೆ ಹೊಸಬನು. worksheet ಎಂದರೇನು, ಮತ್ತು sheet tabs ಬಳಸಿ workbook ನಲ್ಲಿ ಹೇಗೆ ಓಡಾಡಬಹುದು?",
    "A1 ನಲ್ಲಿ 10 ಇದ್ದು, B1 ರ formula ಅನ್ನು B2 ಗೆ ನಕಲಿಸಿದಾಗ cell reference ಏಕೆ ಬದಲಾಗಬಹುದು? $A$1 ಎಂದರೇನು?",
    "equals sign ನಿಂದ ಆರಂಭಿಸಿ SUM ಅಥವಾ AVERAGE ಗೆ ಸಣ್ಣ ಸಂಖ್ಯೆಗಳ ಉದಾಹರಣೆ ಕೊಡಬಹುದೇ?",
    "ಒಂದೇ number ಅನ್ನು ಹಣ, ಶೇಕಡಾವಾರು ಅಥವಾ ದಿನಾಂಕವಾಗಿ ಹೇಗೆ ತೋರಿಸುತ್ತೀರಿ? number format ಏಕೆ ಮುಖ್ಯ?",
    "Excel table ಏಕೆ ಉಪಯುಕ್ತ? headers, sorting, filtering ಮತ್ತು totals row ಬಗ್ಗೆ ತಿಳಿಸಿ."
  ]
};

export function openingPrompt(language: Language): string {
  return questions[language][0];
}

export function nextMockPrompt(language: Language, questionIndex: number): string {
  return questions[language][questionIndex] ?? closingPrompt(language);
}

function closingPrompt(language: Language): string {
  const closing: Record<Language, string> = {
    en: "Thank you. I have asked my five practice questions. Goodbye.",
    hi: "धन्यवाद। मैंने अपने पाँच अभ्यास वाले सवाल पूछ लिए हैं। अलविदा।",
    kn: "ಧನ್ಯವಾದಗಳು. ನನ್ನ ಐದು ಅಭ್ಯಾಸ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿದ್ದೇನೆ. ವಿದಾಯ."
  };
  return closing[language];
}
