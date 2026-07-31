import anime from 'animejs/lib/anime.es.js';

const loaded = new Promise((resolve, reject) => {
  let stateCheck = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(stateCheck);
      // document ready
      resolve("Website resources loaded");
    }
  }, 100);

  // Remove Loader even if page hasn't loaded in 12 seconds
  setTimeout(() => {
    reject("Website resources taking too long to load, removing loader");
  }, 12000)
})

function loaderRemovalAnimation() {
  const loader = document.querySelector( '.loading-screen' );
  const header = document.querySelector( '.site-header' );
  const body   = document.querySelector( 'body' );

  anime({
      targets: loader,
      opacity: 0,
      duration: 600,
      easing: 'easeInOutExpo',
      complete: function() {
          loader.style.display = 'none';
      }
  });

  body.style.setProperty(
    '--header-height',
    getComputedStyle( header ).getPropertyValue( '--header-height' )
  );
}

export default function removeLoader() {
  loaded.then( ( value ) => {
    console.log( value );
    loaderRemovalAnimation();
  })
  .catch( ( value ) => {
    console.log( value );
    loaderRemovalAnimation();
  });
}