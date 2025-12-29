// Loading Animation
window.addEventListener('load', () => {
  setTimeout(() => {
      document.querySelector('.loader-wrapper').style.opacity = '0';
      setTimeout(() => {
          document.querySelector('.loader-wrapper').style.display = 'none';
      }, 500);
  }, 2000);
});

//document.addEventListener('mousedown', () => {
//  cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
//});
//
//document.addEventListener('mouseup', () => {
//  cursor.style.transform = 'translate(-50%, -50%) scale(1)';
//});

// Scrolled Header
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 100) {
      header.classList.add('scrolled');
  } else {
      header.classList.remove('scrolled');
  }
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const projectObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
          setTimeout(() => {
              entry.target.classList.add('animated');
          }, index * 200);
      }
  });
}, observerOptions);

document.querySelectorAll('.project-card').forEach(card => {
  projectObserver.observe(card);
});

const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
      if (entry.isIntersecting) {
          entry.target.classList.add('animated');
      }
  });
}, observerOptions);

document.querySelectorAll('.timeline-content').forEach(item => {
  timelineObserver.observe(item);
});

const achievementObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
          setTimeout(() => {
              entry.target.classList.add('animated');
          }, index * 200);
      }
  });
}, observerOptions);

document.querySelectorAll('.achievement-card').forEach(card => {
  achievementObserver.observe(card);
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;

      window.scrollTo({
          top: target.offsetTop - 100,
          behavior: 'smooth'
      });
  });
});

// Contact form: validate Web3Forms access_key (UUID v4) before submit
(function() {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function initContactValidation() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const accessKeyInput = document.getElementById('web3formsAccessKey');
    const errorBox = document.getElementById('formError');

    form.addEventListener('submit', function(e) {
      const key = (accessKeyInput?.value || '').trim();
      if (!uuidRegex.test(key)) {
        e.preventDefault();
        if (errorBox) {
          errorBox.style.display = 'block';
          errorBox.textContent = 'Form submission failed. Configure a valid Web3Forms access_key (UUID) in the hidden field.';
        }
        const nameField = document.getElementById('name');
        if (nameField) nameField.focus();
      } else {
        if (errorBox) errorBox.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactValidation);
  } else {
    initContactValidation();
  }
})();
