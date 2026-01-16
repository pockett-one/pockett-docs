
const Fuse = require('fuse.js');

const faqs = [
    {
        id: 'security',
        question: "Is my data secure with Pockett?",
        answer: "Absolutely. We use enterprise-grade security measures..."
    },
    {
        id: 'cost',
        question: "How much does Pockett cost?",
        answer: "Pockett offers a free tier... Our pricing is designed to be accessible..."
    }
];

const options = {
    keys: [
        { name: 'question', weight: 1 },
        { name: 'answer', weight: 1 }
    ],
    includeScore: true,
    threshold: 0.3, // Current setting
    ignoreFieldNorm: true,
    ignoreLocation: true,
    minMatchCharLength: 3
};

const fuse = new Fuse(faqs, options);
const results = fuse.search("price");

console.log("--- Current Settings Results ---");
results.forEach(r => console.log(`${r.item.id}: ${r.score} (Match: ${r.item.answer.includes('pricing') ? 'pricing' : 'enterprise'})`));

// Experiment: Lower threshold
const strictOptions = { ...options, threshold: 0.15 };
const strictFuse = new Fuse(faqs, strictOptions);
const strictResults = strictFuse.search("price");

console.log("\n--- Strict (0.15) Settings Results ---");
strictResults.forEach(r => console.log(`${r.item.id}: ${r.score}`));
