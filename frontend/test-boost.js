
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
    threshold: 0.4,
    ignoreLocation: true,
    ignoreFieldNorm: true,
    minMatchCharLength: 3
};

const fuse = new Fuse(faqs, options);
const query = "price";
const results = fuse.search(query);

console.log("--- Original Scores ---");
results.forEach(r => {
    console.log(`${r.item.id}: ${r.score} (Substring Match: ${r.item.answer.toLowerCase().includes(query.toLowerCase())})`);
});

// Boost Logic
const boosted = results.map(r => {
    // Check if query is strict substring of specific fields
    const isSubstring = r.item.question.toLowerCase().includes(query) ||
        r.item.answer.toLowerCase().includes(query);

    return {
        ...r,
        // If substring match, force score to almost 0 (perfect)
        // If fuzzy only, keep original score
        score: isSubstring ? 0.01 : r.score
    };
}).sort((a, b) => a.score - b.score);

console.log("\n--- Boosted Scores ---");
boosted.forEach(r => console.log(`${r.item.id}: ${r.score}`));

// Filter Filter?
const filtered = boosted.filter(r => r.score < 0.1);
console.log("\n--- Filtered (< 0.1) ---");
filtered.forEach(r => console.log(`${r.item.id}`));
