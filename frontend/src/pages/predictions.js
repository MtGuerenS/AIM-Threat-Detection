import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LinearProgress from '@mui/material/LinearProgress'
import styles from '../styles/Predictions.module.css'

const Predictions = ({ fileName }) => {
    const [loading, setLoading] = useState(true)
    const [predLoading, setPredLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [variant, setVariant] = useState('indeterminate')
    const [pred, setPred] = useState([])
    const [vid, setVid] = useState('')
    const [clipIndex, setClipIndex] = useState(0)

    const handlePrediction = () => {
        let predictions = []
        setProgress(0)
        setPredLoading(false)
        processVideo()
        return(' ')

        async function processVideo() {
            const response = await fetch('/api/process-video/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'video_path': fileName
                }),
            });
            const data = await response.json();
            console.log(data)
            setVariant('determinate')
            setProgress((progress) => {return progress + 25})
            uploadTensors(data.tensor_locations)
        }

        async function uploadTensors(tensorLocations) {
            for (const tensorLocation of tensorLocations) {
                const response = await fetch('/api/upload-tensor/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'tensor_location': tensorLocation,
                    }),
                });
                const data = await response.json();
                console.log(data)
                setProgress((progress) => {return progress + 35/tensorLocations.length})
                const prediction = await makePrediction(tensorLocation)
                predictions.push(prediction)
                setPred((pred) => {
                    console.log(pred)
                    return [...pred, prediction]
                })
                setProgress((progress) => {return progress + 35/tensorLocations.length})
            }
            setProgress((progress) => {return progress + 5})
            console.log("Predictions: ", predictions)
            console.log("Pred: ", pred)
            getClip(predictions)
        }
        
        async function makePrediction(tensorLocation) {
            const response = await fetch('/api/make-prediction/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'tensor_location': tensorLocation,
                }),
            });
            const data = await response.json();
            console.log(data)
            
            return data.predictions
        }

        async function getClip(predictions) {
            const sorted = predictions.sort((a,b) => {return a['prediction'][0] - b['prediction'][0]})
            setPred(sorted)
            setClipIndex(sorted[0]['clip_index'])
            console.log("Sorted: ", sorted)
            const url = '/api/make-clip/'+fileName+'/'+sorted[0]['clip_index']
            const response = await fetch(url)
            const blob = await response.blob()
            setVid(URL.createObjectURL(blob))
            setLoading(false);
        }
    }
    
    return(
        <div className={styles.container}>
            {loading ? ( predLoading ? handlePrediction() :
                <LinearProgress 
                    variant={variant}
                    color='inherit'
                    value={progress}
                    sx={{
                        width: 1/2,
                        height: 8,
                        borderRadius: 25,
                    }} 
                />
            ) : (
                <div className={styles.predContainer}>
                    {/* <ul>
                        {pred.map((prediction) => {return <li key={prediction['clip_index']} >{prediction['prediction'].toString()}</li>})}
                    </ul> */}
                    <div className={styles.predRight}>
                        <div className={styles.predText}>
                            <h2 className={styles.header} >Results</h2>
                            <ul className={styles.list} >
                                The video is classified as a <b>threat</b>
                                <li>
                                    Clip {pred[0]['clip_index']} was the most violent
                                </li>
                                <li>
                                    Clip {pred[pred.length-1]['clip_index']} was the least violent
                                </li>
                            </ul>
                        </div>
            
                        <div className={styles.videoContainer} >
                            <video controls src={vid} className={styles.video} />
                        </div>
                    </div>
                    <button className={styles.glassButton} onClick={() => {router.push('/video-upload')}}> 
                        Restart
                    </button>
                </div>
            )}
        </div>
    )
}

export const getServerSideProps = async ({ query }) => {
    return {
        props: {
            fileName: query.fileName,
        },
    };
};

export default Predictions