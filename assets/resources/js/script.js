/* Page Loader */
$(window).on('load', function() {
    $('.page-loader').addClass('hidden');
    setTimeout(function() {
        $('.page-loader').remove();
    }, 500);
});

/* Floating Action Button Toggle */
$(document).on('click', '.fab-main', function() {
    $('.fab-container').toggleClass('active');
});

$(document).ready(function() {
    /* For the sticky navigation */
    $(".js--section-features").waypoint(
        function(direction) {
            if (direction == "down") {
                $("nav").addClass("sticky");
            } else {
                $("nav").removeClass("sticky");
            }
        }, {
            offset: "60px;",
        }
    );

    /* Scroll on buttons */
    $(".js--scroll-to-plans").click(function() {
        $("html, body").animate({
                scrollTop: $(".js--section-plans").offset().top
            },
            1000
        );
    });

    $(".js--scroll-to-start").click(function() {
        $("html, body").animate({
                scrollTop: $(".js--section-features").offset().top
            },
            1000
        );
    });

    /* Navigation scroll */
    $(function() {
        $("a[href*=#]:not([href=#])").click(function() {
            if (
                location.pathname.replace(/^\//, "") ==
                this.pathname.replace(/^\//, "") &&
                location.hostname == this.hostname
            ) {
                var target = $(this.hash);
                target = target.length ?
                    target :
                    $("[name=" + this.hash.slice(1) + "]");
                if (target.length) {
                    $("html,body").animate({
                            scrollTop: target.offset().top,
                        },
                        1000
                    );
                    return false;
                }
            }
        });
    });

    /* Animations on scroll */
    $(".js--wp-1").waypoint(
        function(direction) {
            $(".js--wp-1").addClass("animated fadeIn");
        }, {
            offset: "50%",
        }
    );

    $(".js--wp-2").waypoint(
        function(direction) {
            $(".js--wp-2").addClass("animated fadeInUp");
        }, {
            offset: "50%",
        }
    );

    $(".js--wp-3").waypoint(
        function(direction) {
            $(".js--wp-3").addClass("animated fadeIn");
        }, {
            offset: "50%",
        }
    );

    $(".js--wp-4").waypoint(
        function(direction) {
            $(".js--wp-4").addClass("animated pulse");
        }, {
            offset: "50%",
        }
    );

    /* Mobile navigation */
    $(".js--nav-icon").click(function() {
        var nav = $(".js--main-nav");
        var icon = $(".js--nav-icon i");

        nav.slideToggle(200);

        if (icon.hasClass("ion-navicon-round")) {
            icon.addClass("ion-close-round");
            icon.removeClass("ion-navicon-round");
        } else {
            icon.addClass("ion-navicon-round");
            icon.removeClass("ion-close-round");
        }
    });

    /* Counter Animation */
    function animateCounter(element) {
        var $this = $(element);
        var target = parseInt($this.attr('data-target'));
        var duration = 2000; // 2 seconds
        var increment = target / (duration / 16); // 60fps
        var current = 0;

        var timer = setInterval(function() {
            current += increment;
            if (current >= target) {
                $this.text(target);
                clearInterval(timer);
            } else {
                $this.text(Math.floor(current));
            }
        }, 16);
    }

    // Trigger counter when section comes into view
    $('.counter').each(function() {
        var $counter = $(this);
        $counter.waypoint(function(direction) {
            if (direction === 'down' && !$counter.hasClass('counted')) {
                $counter.addClass('counted');
                animateCounter($counter[0]);
            }
        }, {
            offset: '75%'
        });
    });

    /* Scroll to Top Button */
    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            $('.scroll-to-top').fadeIn();
        } else {
            $('.scroll-to-top').fadeOut();
        }
    });

    $('.scroll-to-top').click(function() {
        $('html, body').animate({
            scrollTop: 0
        }, 800);
        return false;
    });

    /* Image Lightbox/Gallery - Fixed: Use event delegation to prevent handler accumulation */
    $(document).on('click', '.gallery-img', function() {
        var imgSrc = $(this).attr('src');
        var imgAlt = $(this).attr('alt');
        
        // Remove existing lightbox if any
        $('.lightbox-overlay').remove();
        
        var lightbox = $('<div class="lightbox-overlay"><div class="lightbox-content"><span class="lightbox-close">&times;</span><img src="' + imgSrc + '" alt="' + imgAlt + '"></div></div>');
        $('body').append(lightbox);
        lightbox.fadeIn(300);
    });

    // Fixed: Use event delegation for lightbox close - handles both overlay and close button
    $(document).on('click', '.lightbox-overlay', function(e) {
        // Close if clicking overlay background or close button
        if ($(e.target).hasClass('lightbox-overlay') || $(e.target).hasClass('lightbox-close') || $(e.target).closest('.lightbox-close').length) {
            $(this).fadeOut(300, function() {
                $(this).remove();
            });
        }
    });

    /* Form Validation with Animation */
    $('.contact-form').on('submit', function(e) {
        var isValid = true;
        
        $(this).find('input[required], textarea[required]').each(function() {
            var $field = $(this);
            var value = $field.val().trim();
            
            if (value === '') {
                isValid = false;
                $field.addClass('error-shake');
                setTimeout(function() {
                    $field.removeClass('error-shake');
                }, 500);
            } else {
                $field.removeClass('error-shake');
            }
        });

        // Mobile number validation
        var mobile = $('input[name="mobile_number"]').val();
        if (mobile && !/^[0-9]{10}$/.test(mobile)) {
            isValid = false;
            $('input[name="mobile_number"]').addClass('error-shake');
            setTimeout(function() {
                $('input[name="mobile_number"]').removeClass('error-shake');
            }, 500);
        }

        if (!isValid) {
            e.preventDefault();
        } else {
            // Show success animation
            $(this).addClass('form-submitted');
        }
    });

    /* Parallax Effect for Hero Section */
    $(window).scroll(function() {
        var scrolled = $(window).scrollTop();
        var parallax = $('header');
        var speed = scrolled * 0.5;
        parallax.css('transform', 'translateY(' + speed + 'px)');
    });

    /* Smooth reveal animations for sections */
    $('section').each(function() {
        var $section = $(this);
        $section.waypoint(function(direction) {
            if (direction === 'down') {
                $section.addClass('section-visible');
            }
        }, {
            offset: '60%'
        });
    });

    /* Floating Action Button */
    $('.fab-call').click(function() {
        window.location.href = 'tel:+919198923230';
    });

    $('.fab-whatsapp').click(function() {
        window.open('https://wa.me/919198923230?text=नमस्ते, मुझे गुरुकृपा ईंट के बारे में जानकारी चाहिए', '_blank');
    });

    /* Chatbot Functionality */
    $('#chatbotToggle').click(function() {
        $('#chatbot').toggleClass('active');
    });

    $('#chatbotClose').click(function() {
        $('#chatbot').removeClass('active');
    });

    $('#chatbotSend').click(function() {
        sendChatbotMessage();
    });

    $('#chatbotInput').keypress(function(e) {
        if (e.which === 13) {
            sendChatbotMessage();
        }
    });

    function sendChatbotMessage() {
        var message = $('#chatbotInput').val().trim();
        if (message === '') return;

        // Add user message
        var userMsg = $('<div class="chatbot-message user-message"><p>' + message + '</p></div>');
        $('#chatbotMessages').append(userMsg);
        $('#chatbotInput').val('');
        $('#chatbotMessages').scrollTop($('#chatbotMessages')[0].scrollHeight);

        // Simulate bot response
        setTimeout(function() {
            var responses = [
                'धन्यवाद! हमारी ईंटों के बारे में अधिक जानकारी के लिए कृपया हमें +91 9198923230 पर कॉल करें।',
                'हमारी ईंटें उच्च गुणवत्ता वाली हैं और 25+ वर्षों का अनुभव है।',
                'हम जौनपुर, वाराणसी, त्रिलोचन और जलालपुर में सेवा प्रदान करते हैं।',
                'कृपया हमारी वेबसाइट देखें या सीधे हमसे संपर्क करें।'
            ];
            var randomResponse = responses[Math.floor(Math.random() * responses.length)];
            var botMsg = $('<div class="chatbot-message bot-message"><p>' + randomResponse + '</p></div>');
            $('#chatbotMessages').append(botMsg);
            $('#chatbotMessages').scrollTop($('#chatbotMessages')[0].scrollHeight);
        }, 500);
    }
});



let getData = function() {
    let values = {};
    $.each($("#contact-form").serializeArray(), function(i, field) {
        values[field.name] = field.value;
    });
    return values; // Fixed: Return the values object
};