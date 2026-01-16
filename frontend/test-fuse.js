
const Fuse = require('fuse.js');

const faqs = [
    {
        question: "How does Pockett connect to my Google Drive?",
        answer: "Pockett uses secure OAuth 2.0 authentication..."
    },
    {
        question: "How much does Pockett cost?",
        answer: "Pockett offers a free tier... Our pricing is designed to be accessible..."
    }
];

const options = {
    keys: ['question', 'answer'],
    threshold: 0.6,
    distance: 1000,
    ignoreLocation: true,
    minMatchCharLength: 2
};

const fuse = new Fuse(faqs, options);
const results = fuse.search("price");

console.log("Searching for 'price'...");
console.log("Results found:", results.length);
results.forEach(r => {
    console.log(`- Match: "${r.item.question}" (Score: ${r.score})`);
});
