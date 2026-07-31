import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import imagesLoaded from 'imagesloaded';
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

function Percentage( { percent } ) {
    return (
        <span className='aspen--loading-percent'>{ percent }%</span>
    );
}

function LoadingBar( { percent } ) {
    return (
        <div className='aspen--loading-bar' style={ { width: percent + '%' } }></div>
    );
}

function PageLoader( { imgLoad } ) {
    const [ pageLoadedPercent, setPageLoadedPercent ] = useState( 0 );
    const [ pageLoaded, setPageLoaded ] = useState( false );
    const [ animatedPercent, setAnimatedPercent ] = useState( 0 );
    const [ animatedTimestamp, setAnimatedTimestamp ] = useState( 0 );
    const [ loaderOpacity, setLoaderOpacity ] = useState( 1 );
    const [ opacityTimestamp, setOpacityTimestamp ] = useState( 0 );

    // Check the amount of images that need to be loaded
    useEffect( () => {
        let ttlLoaded = 0;
        
        loaded.then( ( value ) => {
            setPageLoaded( true );
          })
          .catch( ( value ) => {
            setPageLoaded( true );
          });

        imgLoad.on( 'progress', function() {
            ttlLoaded++;

            setPageLoadedPercent( Math.round(  ttlLoaded / imgLoad.images.length * 100 ) );
        } );

    }, [ imgLoad, setPageLoadedPercent, setPageLoaded, loaded ] );

    // Animate the loading page
    useEffect( () => {
        let aP = { percentToFinish: 0 };
        let animDur = 3000;
        let pausePercent = 97;

        let animation = anime({
            targets: aP,
            percentToFinish: 100,
            duration: animDur,
            easing: 'easeOutCirc',
            round: 1,
            loop: false,
            autoplay: false,
            update: ( anim ) => {
                if ( aP.percentToFinish < pausePercent || pageLoaded ) {
                    setAnimatedPercent( aP.percentToFinish );
                }
                setAnimatedTimestamp( animDur * ( Math.min( Math.max( anim.progress, pageLoadedPercent ), pausePercent ) / 100 ) );
            }
        } );

        if ( animatedTimestamp < Math.round( animDur * ( pausePercent / 100 ) ) ) {
            animation.seek( animatedTimestamp );
            animation.play();
        } else {
            if ( pageLoadedPercent < pausePercent ) {
                setAnimatedPercent( pausePercent );
            } else {
                setAnimatedPercent( 100 );
            }
        }

        if ( pageLoaded ) {
            setAnimatedPercent( 100 );
        }

        return ( () => {
            // Unmount each state refresh to reduce errors
            anime.remove( aP );
        } );
        
    }, [ animatedPercent, animatedTimestamp, pageLoadedPercent, pageLoaded, setAnimatedPercent, setAnimatedTimestamp ] );

    // If Loaded then fade out
    useEffect( () => {
        let lO = { loaderOpacity: 1 };
        let animDur = 150;

        if ( animatedPercent === 100 ) {
            let animation = anime({
                targets: lO,
                loaderOpacity: 0,
                duration: animDur,
                autoplay: false,
                easing: 'easeInCubic',
                round: 1000,
                update: ( anim ) => {
                    setLoaderOpacity( lO.loaderOpacity );
                    setOpacityTimestamp( animDur * ( anim.progress / 100 ) );
                }
            });

            if ( opacityTimestamp < animDur ) {
                animation.seek( opacityTimestamp );
                animation.play();
            } else {
                setLoaderOpacity( 0 );
            }
        }

        return ( () => {
            // Unmount each state refresh to reduce errors
            anime.remove( lO );
            document.querySelector( '.preloader' ).classList.add( 'loader-done' );
        } );

    }, [ animatedPercent, opacityTimestamp, setLoaderOpacity, setOpacityTimestamp ] );

    return (
        <>
            { loaderOpacity !== 0 &&
            <div className='aspen--loading' style={ { opacity: loaderOpacity } }>
                <Percentage percent={ animatedPercent } />
                <LoadingBar percent={ animatedPercent } />
            </div>
            }
        </>
    );
}

export default function pageLoader() {
    if ( ! document.querySelector( '.customize-partial-edit-shortcuts-shown' ) ) {
        const imgLoad = new imagesLoaded( document.querySelector( '.site-container' ) );
        const preloader = document.querySelector('.preloader');

        if ( preloader !== undefined ) {
            let root = '';

            if ( createRoot ) {
                root = createRoot( preloader, { identifierPrefix: 'preloader' } );
            }
        
            if ( root ) {
                root.render( <PageLoader imgLoad={ imgLoad }/> );
            } else {
                ReactDOM.render( <PageLoader imgLoad={ imgLoad }/>, preloader );
            }
        }
    } else {
        document.querySelector( '.preloader' ).querySelector( '.aspen--loading' ).remove();
    }
}