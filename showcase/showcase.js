document.addEventListener("DOMContentLoaded", () => {
    // Select all cards
    const cards = document.querySelectorAll(".card");

    // Apply initial state (invisible and slightly lower)
    cards.forEach((card) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(30px)";
        // We set the transition here so it applies when we remove the transform later
        card.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out, border-color 0.2s, box-shadow 0.2s"; 
    });

    // Trigger animation with a stagger delay
    cards.forEach((card, index) => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
            });
        }, index * 150 + 100); // 150ms delay between cards
    });
});