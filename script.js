document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.querySelectorAll('#current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenuClose && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        mobileMenuClose.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Image generator functionality
    const generateBtn = document.getElementById('generate-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const saveBtn = document.getElementById('save-btn');
    const promptInput = document.getElementById('prompt');
    const imageResult = document.getElementById('image-result');
    const generatedImg = document.getElementById('generated-img');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (generateBtn && promptInput && imageResult) {
        generateBtn.addEventListener('click', async function() {
            const prompt = promptInput.value.trim();
            if (!prompt) return;
            
            // Show loading state
            if (loadingOverlay) loadingOverlay.style.display = 'flex';
            
            const formData = new FormData();
            formData.append("prompt", prompt);

            try {
                const response = await fetch("/", {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    generatedImg.src = url;
                    imageResult.style.display = 'block'; // Show the image container
                } else {
                    if (response.status === 302) {
                        console.log("Redirecting to login page...");
                        window.location.href = '/login';
                    } else {
                        alert("An error occurred. Please try again.");
                    }
                }
            } catch (error) {
                // alert("An error occurred. Please try again.");
            } finally {
                // Hide loading
                if (loadingOverlay) loadingOverlay.style.display = "none";
            }
        });
        
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', function() {
                generateBtn.click();
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                const link = document.createElement('a');
                link.href = generatedImg.src;
                link.download = 'generated_image.png';
                link.click();
            });
        }
    }

    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formValues = Object.fromEntries(formData.entries());
            
            // In a real application, you would send this data to your backend
            console.log('Form submitted:', formValues);
            
            // Show success message
            alert('Thank you for your message! We\'ll get back to you soon.');
            
            // Reset form
            contactForm.reset();
        });
    }
    
    // Image generation form submission
    const form = document.getElementById("image-form");
    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            // Show loading
            if (loadingOverlay) loadingOverlay.style.display = "flex";

            const formData = new FormData();
            formData.append("prompt", promptInput.value);

            try {
                const response = await fetch("/", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();
                if (data.image) {
                    generatedImg.src = data.image;
                    imageResult.style.display = 'block'; // Show the image container
                } else {
                    // alert("Error generating image: " + data.error);
                }
            } catch (error) {
                // alert("An error occurred. Please try again.");
            } finally {
                // Hide loading
                if (loadingOverlay) loadingOverlay.style.display = "none";
            }
        });
    }
});

function openChatbot() {
    window.open("http://127.0.0.1:5000", "chatbot", "width=400,height=600,left=" + (window.innerWidth - 420) + ",top=100");
}