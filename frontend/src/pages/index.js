import styles from  '../styles/Mouse.module.css'
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function App() {
    const [mousePos, setMousePos] = useState({x: null, y: null});
    const updateSVG = useRef(null);
    const router = useRouter()

    useEffect(() => {
        const centerX = window.innerWidth/2
        const centerY = window.innerHeight/2

        const handleMouseMove = (event) => {
            // updateSVG.current.style.transform = `translate3d(${event.clientX - mousePos.x}px, 
            //     ${event.clientY - mousePos.y}px, 0)`;
            updateSVG.current.style.transform = `translate(${(event.clientX - centerX)/30}px, 
                ${(event.clientY - centerY)/30}px)`;
            setMousePos({ x: event.clientX, y: event.clientY });
        };
    
        window.addEventListener('mousemove', handleMouseMove);
    
        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mousePos]);

    return (
        <div className={styles.container}>
            {/* The mouse is at position{' '}
            <b>
                ({mousePos.x}, {mousePos.y})
            </b> */}
            <div className={styles.criminalContainer}>
                <img src='/criminal.svg' className={styles.criminal} />
                <div className={styles.criminalEyes} ref={updateSVG} >
                    <div className={styles.circle} />
                    <div className={styles.circle} />
                </div>
            </div>
            <button className={styles.glassButton} onClick={() => {router.push('/video-upload')}}> 
                Get started 
            </button>
        </div>
    );
}