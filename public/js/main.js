document.addEventListener('DOMContentLoaded', () => {


const searchInput = document.getElementById('searchInput');
const searchIcon = document.querySelector('.search-icon');
const guessPopup = document.getElementById('guessPopup');

// 📚 BOOK DATA (same names as files)
const books = [
    { name: "1984", link: "pages/1984.html" },
    { name: "the great gatsby", link: "pages/thegreatgatsby.html" },
    { name: "crime punishment", link: "pages/crimepunishment.html" },
    { name: "moby dick", link: "pages/mobydick.html" },
    { name: "one hundred", link: "pages/onehundred.html" },
    { name: "war and peace", link: "pages/warandpeace.html" },
    { name: "pride and prejudice", link: "pages/prideandprejudice.html" },
    { name: "lord of ring", link: "pages/lordofring.html" },
    { name: "mockingbird", link: "pages/mockingbird.html" },
    { name: "godan", link: "pages/godan.html" },
    { name: "gaban", link: "pages/gaban.html" }
];

// 🔍 FUNCTION → SEARCH + REDIRECT
function searchBook() {
    const value = searchInput.value.toLowerCase().trim();

    const found = books.find(book =>
        book.name.includes(value)
    );

    if (found) {
        window.location.href = found.link;
    } else {
        alert("Book not found ❌");
    }
}

// ⌨️ ENTER KEY
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchBook();
    }
});

// 🔍 CLICK ICON
searchIcon.addEventListener("click", () => {
    searchBook();
});

// 📋 SUGGESTIONS
searchInput.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase();
    guessPopup.innerHTML = "";

    if (value === "") {
        guessPopup.style.display = "none";
        return;
    }

    const filtered = books.filter(book =>
        book.name.includes(value)
    );

    filtered.slice(0, 5).forEach(book => {
        const item = document.createElement("div");
        item.textContent = book.name;

        // click suggestion → open page
        item.addEventListener("click", () => {
            window.location.href = book.link;
        });

        guessPopup.appendChild(item);
    });

    guessPopup.style.display = "block";
});

// ❌ click outside close
document.addEventListener("click", (e) => {
    if (!guessPopup.contains(e.target) && e.target !== searchInput) {
        guessPopup.style.display = "none";
    }
});


});
