import pytorchvideo.data
import torch
import boto3, botocore
import io, os, json
import requests, base64
from moviepy.editor import VideoFileClip

from pytorchvideo.transforms import (
    ApplyTransformToKey,
    Normalize,
    UniformTemporalSubsample,
)

from torchvision.transforms import (
    Compose,
    Lambda,
    Resize,
)

s3 = boto3.client('s3')
bucket_name = 'aim-anomaly-detection'

mean = [0.485, 0.456, 0.406]
std = [0.229, 0.224, 0.225]
resize_to = 224
num_frames_to_sample = 16
clip_duration = 32/15

# transformations applied to data
transform = Compose(
    [
        ApplyTransformToKey(
            key="video",
            transform=Compose(
                [
                    UniformTemporalSubsample(num_frames_to_sample),
                    Lambda(lambda x: x / 255.0),
                    Normalize(mean, std),
                    Resize((resize_to, resize_to)),
                ]
            ),
        ),
    ]
)

# path_to_video is the path to a locally stored video
# returns pytorchvideo.data.labeled_video.LabeledVideoDataset
def process_video(path_to_video):
    processed_vid = pytorchvideo.data.LabeledVideoDataset(
                        labeled_video_paths=[(path_to_video, {'label': -1})],
                        clip_sampler=pytorchvideo.data.make_clip_sampler("uniform", clip_duration), # , clip_duration/2),
                        decode_audio=False,
                        transform=transform,
                    )
    return iter(processed_vid)

"""
    Saves a tensor as a file in ./tensors and returns the file location
    processed_data = {
        video: Tensor(),
        video_name: str(),
        video_index, clip_index, aug_index, label: int,
    }
    unique_tag = string date _%Y_%m_%d_%H%M%S_
"""
def save_tensor(processed_data, unique_tag):
    vid_names = processed_data["video_name"].split('.') # splits the '.mp4' from file name
    clip_index = processed_data["clip_index"]
    video_name = vid_names[0] + unique_tag + str(clip_index) + '.pt' # Ex. vid_2023_04_24_163954_0.pt
    file_path = 'tensors/' + video_name
    
    print(file_path)
    video = processed_data["video"]
    torch.save(video, file_path) # saves video tensor into file_path
    return file_path

def upload_tensor(file_path):
    key = 'Video-Classification-Videos/' + file_path
    
    s3.upload_file(file_path, bucket_name, key)
    os.remove(file_path)
    print(f'Uploaded {file_path}.')

api_link = 'https://40brrtleb1.execute-api.us-east-1.amazonaws.com/prod/predict-threat'

def call_model(file_path):
    key = 'Video-Classification-Videos/' + file_path 
    s3_path = 's3://' + bucket_name + '/' + key
    
    input = { "s3_path": s3_path }
    print(input)
    
    response = requests.post(api_link, json=input)
    my_json = response.json()
    print(my_json)
    
    s3.delete_object(Bucket=bucket_name, Key=key) # removes the file from s3
    print(f'Removed {key}.')
    
    result =  {
        'clip_index': file_path.split('_')[-1][0], 
        'prediction': my_json
        }
    return result

def make_clip(file_name, clip_index):
    clip = VideoFileClip(file_name)
    clip_end = clip.duration
    
    file_name = f'{file_name.split(".")[0]}-{clip_index}.mp4'
    clip = clip.subclip((clip_index * clip_duration), (min(clip_end, (clip_index+1) * clip_duration)))
    clip.write_videofile(file_name)