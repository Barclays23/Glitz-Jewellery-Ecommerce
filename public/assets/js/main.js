!(function (s) {
  "use strict";
  (s.fn.exists = function () {
    return 0 < this.length;
  }),
    s(".tm-preloader .tm-button").on("click", function () {
      s(".tm-preloader").fadeOut();
    }),
    s(window).on("load", function () {
      s(".tm-preloader").fadeOut();
    });
  var t = {
    headerOptionsDropdown: function () {
      s(".tm-dropdown > button").on("click", function () {
        s(this).siblings("ul").slideToggle(),
          s(this)
            .parent(".tm-dropdown")
            .siblings(".tm-dropdown")
            .children("ul")
            .slideUp();
      });
    },
    databgImage: function () {
      s("[data-bgimage]").each(function () {
        var t = s(this).data("bgimage");
        s(this).css({ "background-image": "url(" + t + ")" });
      });
    },
    meanmenuActivation: function () {
      s(".tm-header-nav").meanmenu({
        meanMenuContainer: ".tm-mobilenav",
        meanScreenWidth: "991",
        meanMenuOpen: '<i class="ion-android-menu"></i>',
        meanMenuClose: '<i class="ion-android-close"></i>',
      });
    },
    niceSelectActive: function () {
      s("select").niceSelect();
    },
    countdownActivation: function () {
      s(".tm-countdown").each(function () {
        var e = s(this),
          t = s(this).data("countdown");
        e.countdown(t, function (t) {
          e.html(
            t.strftime(
              '<div class="tm-countdown-pack tm-countdown-day"><h2 class="tm-countdown-count">%-D</h2><h6>Days</h6></div><div class="tm-countdown-pack tm-countdown-hour"><h2 class="tm-countdown-count">%-H</h2><h6>Hours</h6></div><div class="tm-countdown-pack tm-countdown-minutes"><h2 class="tm-countdown-count">%M</h2><h6>Minutes</h6></div><div class="tm-countdown-pack tm-countdown-seconds"><h2 class="tm-countdown-count">%S</h2><h6>Seconds</h6></div>'
            )
          );
        });
      });
    },
    sliderActivations: {
      herosliderSliderActivation: function () {
        s(".tm-heroslider-slider").slick({
          infinite: !0,
          autoplay: !0,
          pauseOnHover: !1,
          speed: 2e3,
          autoplaySpeed: 5e3,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: !0,
          prevArrow:
            '<button class="slick-prev slick-arrow"><i class="ion-ios-arrow-back"></i></button>',
          nextArrow:
            '<button class="slick-next slick-arrow"><i class="ion-ios-arrow-forward"></i></button>',
          fade: !0,
          dots: !1,
        });
      },
      productsSliderActivation: function () {
        s(".tm-products-slider").slick({
          infinite: !0,
          autoplay: !0,
          pauseOnHover: !1,
          speed: 2e3,
          autoplaySpeed: 5e3,
          slidesToShow: 4,
          slidesToScroll: 4,
          arrows: !1,
          dots: !1,
          responsive: [
            {
              breakpoint: 1200,
              settings: { slidesToShow: 3, slidesToScroll: 3 },
            },
            {
              breakpoint: 992,
              settings: { slidesToShow: 2, slidesToScroll: 2 },
            },
            {
              breakpoint: 576,
              settings: { slidesToShow: 1, slidesToScroll: 1 },
            },
          ],
        });
      },
      similliarProductSlider: function () {
        s(".tm-products-slider3").slick({
          infinite: !0,
          autoplay: !0,
          pauseOnHover: !1,
          speed: 2e3,
          autoplaySpeed: 5e3,
          slidesToShow: 3,
          slidesToScroll: 3,
          arrows: !1,
          dots: !1,
          responsive: [
            {
              breakpoint: 1200,
              settings: { slidesToShow: 2, slidesToScroll: 2 },
            },
            {
              breakpoint: 992,
              settings: { slidesToShow: 2, slidesToScroll: 2 },
            },
            {
              breakpoint: 576,
              settings: { slidesToShow: 1, slidesToScroll: 1 },
            },
          ],
        });
      },
      brandlogoSliderActivation: function () {
        s(".tm-brandlogo-slider").slick({
          infinite: !0,
          autoplay: !0,
          speed: 2e3,
          autoplaySpeed: 2e3,
          slidesToShow: 5,
          slidesToScroll: 1,
          pauseOnHover: !1,
          arrows: !1,
          dots: !1,
          responsive: [
            {
              breakpoint: 1200,
              settings: { slidesToShow: 4, slidesToScroll: 1 },
            },
            {
              breakpoint: 992,
              settings: { slidesToShow: 3, slidesToScroll: 1 },
            },
            {
              breakpoint: 768,
              settings: { slidesToShow: 2, slidesToScroll: 1 },
            },
            {
              breakpoint: 420,
              settings: { slidesToShow: 1, slidesToScroll: 1 },
            },
          ],
        });
      },
      teamMemberSlider: function () {
        s(".tm-member-slider").slick({
          infinite: !0,
          autoplay: !0,
          speed: 2e3,
          autoplaySpeed: 2e3,
          slidesToShow: 4,
          slidesToScroll: 1,
          arrows: !1,
          dots: !1,
          pauseOnHover: !1,
          responsive: [
            {
              breakpoint: 1200,
              settings: { slidesToShow: 3, slidesToScroll: 1 },
            },
            {
              breakpoint: 992,
              settings: { slidesToShow: 2, slidesToScroll: 1 },
            },
            {
              breakpoint: 576,
              settings: { slidesToShow: 1, slidesToScroll: 1 },
            },
          ],
        });
      },
      productDetailsGallery: function () {
        s(".tm-prodetails-largeimages").slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: !1,
          fade: !0,
          loop: !1,
          asNavFor: ".tm-prodetails-thumbnails",
        }),
          s(".tm-prodetails-thumbnails").slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            loop: !1,
            asNavFor: ".tm-prodetails-largeimages",
            dots: !1,
            centerMode: !0,
            centerPadding: "0",
            arrows: !1,
            focusOnSelect: !0,
          });
      },
      blogSliderActivation: function () {
        s(".tm-blog-slider").slick({
          infinite: !0,
          autoplay: !0,
          pauseOnHover: !1,
          speed: 2e3,
          autoplaySpeed: 5e3,
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows: !1,
          dots: !1,
          responsive: [
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 992, settings: { slidesToShow: 2 } },
            { breakpoint: 768, settings: { slidesToShow: 1 } },
          ],
        });
      },
      init: function () {
        this.herosliderSliderActivation(),
          this.productsSliderActivation(),
          this.similliarProductSlider(),
          this.brandlogoSliderActivation(),
          this.teamMemberSlider(),
          this.productDetailsGallery(),
          this.blogSliderActivation();
      },
    },
    fancyboxSlick: function () {
      s("[data-fancybox]").fancybox({
        beforeShow: function () {
          s(".tm-product-quickview .tm-prodetails-largeimages").slick(
            "slickNext"
          );
        },
      });
    },
    ajaxMailchimp: function () {
      s("#tm-mailchimp-form").ajaxChimp({
        language: "en",
        callback: function (t) {
          "success" === t.result
            ? (s(".tm-mailchimp-success")
                .html("" + t.msg)
                .fadeIn(900),
              s(".tm-mailchimp-error").fadeOut(400))
            : "error" === t.result &&
              s(".tm-mailchimp-error")
                .html("" + t.msg)
                .fadeIn(900);
        },
        url: "YOUR_MAILCHIMP_URL_HERE",
      });
    },
    stickyHeader: function () {
      if (s(".tm-header-sticky").exists()) {
        var t = s(".tm-header-bottomarea").height();
        s(".tm-heroslider-area, .tm-breadcrumb-area").css({
          marginTop: t + "px",
        }),
          s(window).on("scroll", function () {
            550 < s(this).scrollTop()
              ? s(".tm-header").addClass("is-sticky")
              : s(".tm-header").removeClass("is-sticky");
          });
      }
    },
    scrollToTop: function () {
      var e = s("#back-top-top");
      e.css({ visibility: "hidden", opacity: 0 }),
        e.on("click", function () {
          s("html, body").stop().animate({ scrollTop: 0 }, 1e3);
        }),
        s(window).on("scroll", function () {
          var t = s(window).scrollTop();
          s(window).height() < t
            ? e.css({ visibility: "visible", opacity: 1 })
            : e.css({ visibility: "hidden", opacity: 0 });
        });
    },
    herosliderHeight: function () {
      var t = s(".tm-header").height();
      s(".tm-heroslider").css({ "min-height": "calc(100vh - " + t + "px)" });
    },
    rangeSlider: function () {
      s(".tm-rangeslider").nstSlider({
        left_grip_selector: ".tm-rangeslider-leftgrip",
        right_grip_selector: ".tm-rangeslider-rightgrip",
        value_bar_selector: ".tm-rangeslider-bar",
        value_changed_callback: function (t, e, i) {
          s(this).parent().find(".tm-rangeslider-leftlabel").text(e),
            s(this).parent().find(".tm-rangeslider-rightlabel").text(i);
        },
      });
    },
    productRatingInput: function () {
      s(".tm-ratingbox-input").each(function () {
        s(this)
          .find("span")
          .on("mouseenter", function () {
            s(".tm-ratingbox-input span").addClass("is-active"),
              s(this).nextAll("span").removeClass("is-active");
          });
      });
    },
    productQuantityBox: function () {
      s(".tm-quantitybox").append(
        '<div class="decrement-button tm-quantitybox-button">-</i></div><div class="increment-button tm-quantitybox-button">+</div>'
      ),
        s(".tm-quantitybox-button").on("click", function () {
          var t,
            e = s(this),
            i = e.parent().find("input").val();
          (t =
            "+" == e.text()
              ? parseFloat(i) + 1
              : 1 < i
              ? parseFloat(i) - 1
              : 1),
            e.parent().find("input").val(t);
        });
    },
    instafeedActive: function () {
      new Instafeed({
        get: "user",
        userId: 12620117360,
        accessToken: "12620117360.1677ed0.73a0ac15057c4edcada08b9df21cfa49",
        resolution: "low_resolution",
        limit: 8,
        template:
          '<li><a href="{{link}}" target="_blank"><img src="{{image}}" /><ul class="tm-instaphotos-counter"><li><i class="ion-heart"></i> {{likes}}</li><li><i class="ion-chatbubbles"></i> {{comments}}</li></ul></a></li>',
        filter: function (t) {
          return 0 <= t.tags.indexOf("thememarch_jewelery");
        },
      }).run();
    },
    scrollAnimation: function () {
      var e = new ScrollMagic.Controller();
      s(".tm-scrollanim").each(function (t) {
        new ScrollMagic.Scene({
          triggerElement: this,
          triggerHook: 0.8,
          reverse: !1,
        })
          .setClassToggle(this, "scrollanim-action")
          .addTo(e);
      });
    },
    differentAddressFormToggle: function () {
      s("#billform-dirrentswitch").on("change", function () {
        s(this).is(":checked")
          ? s(".tm-checkout-differentform").slideDown()
          : s(".tm-checkout-differentform").slideUp();
      });
    },
    checkoutPaymentMethod: function () {
      s('.tm-checkout-payment input[type="radio"]').each(function () {
        s(this).is(":checked") &&
          s(this).siblings(".tm-checkout-payment-content").slideDown(),
          s(this)
            .siblings("label")
            .on("click", function () {
              s('.tm-checkout-payment input[type="radio"]')
                .prop("checked", !1)
                .siblings(".tm-checkout-payment-content")
                .slideUp(),
                s(this)
                  .prop("checked", !0)
                  .siblings(".tm-checkout-payment-content")
                  .slideDown();
            });
      });
    },
    
    // loginPassShower: function () {
    //   s('input[name="register-pass-show"]').on("change", function () {
    //     "password" == s('input[name="register-pass"]').attr("type")
    //       ? s('input[name="register-pass"]').attr("type", "text")
    //       : s('input[name="register-pass"]').attr("type", "password");
    //   });
    // },

    loginPassShower: function () {   /*the above commented function is changed to this due to register-pass*/
      s('input[name="register-pass-show"]').on("change", function () {
        "password" == s('input[name="registerpassword"]').attr("type")
          ? s('input[name="registerpassword"]').attr("type", "text")
          : s('input[name="registerpassword"]').attr("type", "password");
      });
    },
    menuOverflow: function () {
      s(".tm-header-nav ul li").on("mouseenter mouseleave", function (t) {
        if (s("ul", this).length) {
          var e = s("ul:first", this),
            i = e.offset().left - s("body").offset().left,
            o = e.width();
          e.find("ul").length && (o = 2 * e.width()),
            i + o <= s("body").width()
              ? s(this).removeClass("overflow-element")
              : s(this).addClass("overflow-element");
        }
      });
    },
    dropdownHasChildren: function () {
      s(".tm-header-nav-dropdown ul li").each(function () {
        s(this).children("ul").length && s(this).addClass("has-child");
      });
    },
    ajaxContactForm: function () {
      s(function () {
        var i = s("#tm-contactform"),
          o = s(".form-messages");
        s(i).submit(function (t) {
          t.preventDefault();
          var e = s(i).serialize();
          s.ajax({ type: "POST", url: s(i).attr("action"), data: e })
            .done(function (t) {
              s(o).removeClass("error"),
                s(o).addClass("success"),
                s(o).text(t),
                s(
                  '#tm-contactform input:not([type="submit"]), #tm-contactform textarea'
                ).val("");
            })
            .fail(function (t) {
              s(o).removeClass("success"),
                s(o).addClass("error"),
                "" !== t.responseText
                  ? s(o).text(t.responseText)
                  : s(o).text(
                      "Oops! An error occured and your message could not be sent."
                    );
            });
        });
      });
    },
    portfolioFilter: function () {
      s(".tm-portfolio-wrapper").imagesLoaded({ background: !0 }, function () {
        s(".tm-portfolio-wrapper").isotope({
          itemSelector: ".tm-portfolio-item",
          layoutMode: "masonry",
          masonry: { columnWidth: 1 },
        });
      }),
        s(".tm-portfolio-filters button").on("click", function () {
          var t = s(this).attr("data-filter");
          s(".tm-portfolio-wrapper").isotope({ filter: t }),
            s(".tm-portfolio-filters button").removeClass("is-active"),
            s(this).addClass("is-active");
        });
    },
    productChangeView: function () {
      s(".tm-shop-productview").on("click", "button", function (t) {
        t.preventDefault();
        var e = s(this).data("view");
        s(this).addClass("active").siblings().removeClass("active"),
          "list" === e
            ? s(".tm-shop-products").addClass("list-view")
            : s(".tm-shop-products").removeClass("list-view");
      });
    },
    init: function () {
      t.headerOptionsDropdown(),
        t.databgImage(),
        t.meanmenuActivation(),
        t.niceSelectActive(),
        t.countdownActivation(),
        t.sliderActivations.init(),
        t.fancyboxSlick(),
        t.ajaxMailchimp(),
        t.stickyHeader(),
        t.scrollToTop(),
        t.herosliderHeight(),
        t.rangeSlider(),
        t.productRatingInput(),
        t.productQuantityBox(),
        t.instafeedActive(),
        t.scrollAnimation(),
        t.differentAddressFormToggle(),
        t.checkoutPaymentMethod(),
        t.loginPassShower(),
        t.menuOverflow(),
        t.dropdownHasChildren(),
        t.ajaxContactForm(),
        t.portfolioFilter(),
        t.productChangeView();
    },
  };
  t.init();
})(jQuery);
