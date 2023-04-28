import { useState, useEffect } from "react";
import Head from "next/head";
import ReactPlayer from 'react-player'
import styles from '../styles/videoUpload.module.css'
import { useRouter } from 'next/navigation';
import { format } from 'date-fns'

import { saveAs } from 'file-saver';

var file;

function FileUpload(file) {
    const reader = new FileReader();
    const xhr = new XMLHttpRequest();
    this.xhr = xhr;

    xhr.open(
      "POST",
      "/api/download-video/"
    );
    //xhr.overrideMimeType("text/plain; charset=x-user-defined-binary");
    xhr.overrideMimeType("multipart/form-data");
    reader.onload = (evt) => {
      xhr.send(evt.target.result);
      console.log(evt.target.result)
    };
    //reader.readAsBinaryString(file);
    reader.readAsDataURL(file);
}

const videoUpload = () => {
    const [name, setName] = useState('No file chosen');
    const [loading, setLoading] = useState(true)
    const [selectedFile, setSelectedFile] = useState(<></>);
    const router = useRouter()

    const handleChange = async (event) => {
        file = event.target.files[0]
        console.log(file)

        try {
            setName(file.name)
        }
        catch (err) {
            console.log("File has no property 'name'.")
        }
        
        if (file) {
            const url = URL.createObjectURL(file, { type: 'video/mp4'})
            setLoading(false)
            // setSelectedFile(<ReactPlayer 
            //     playing url={url}
            //     width={200}
            //     height={100}
            // />)
        }
    }

    const handleClick = () => {
      new FileUpload(file)
      router.push({
        pathname: '/predictions',
        query: { fileName: 'store_fight3.mp4' }, //name },
      })
    }

    return (
        <div className={styles.background}>
            <Head>
                <title>Drag And Drop File Upload</title>
                <meta name="description" content="Nextjs drag and drop file upload" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.container}>
                <form className={styles.fileUploadContainer}>
                    <p className={styles.uploadText}>{name}</p>
                    <img src='/upload.svg' className={styles.uploadIcon} />
                    <input
                    type="file"
                    className={styles.fileUpload}
                    onChange={handleChange}
                    />
                </form>
            </div>
            { loading ? (' ') : (
            <div className={styles.buttonContainer}>
                <button className={styles.button} onClick={handleClick}>
                    Upload Video
                </button>
            </div>)}  
            {selectedFile}
        </div>
    );
}

export default videoUpload