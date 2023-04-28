from moviepy.editor import VideoFileClip
import base64
import time
import base64

# with open("store_fight2.mp4", "rb") as f:
#     text = f.read()
#     print(text)

clip_duration = 32/15

def makeClip(file_name, clip_index):
    clip = VideoFileClip(file_name)
    clip_end = clip.duration
    
    file_name = f'{file_name.split(".")[0]}-{clip_index}.mp4'
    clip = clip.subclip((clip_index * clip_duration), (min(clip_end, (clip_index+1) * clip_duration)))
    clip.write_videofile(file_name)
    
    file = open(file_name, 'rb')
    data_url = bytes(b'data:video/mp4;base64,' + base64.b64encode(file.read()))
    return file_name, data_url
    
file_name, data_url = makeClip('videos/store_fight1.mp4', 3)
print(data_url)
print(file_name)
