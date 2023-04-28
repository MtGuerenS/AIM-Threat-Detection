from flask import Flask, request, jsonify, make_response, send_file
import asyncio
import time
import video_processor as vp
import base64, io

app = Flask(__name__)

@app.route('/hello')
def hello_world():
    return {"message": 'Hello World'}

@app.route('/process-video', methods=['POST'])
def process_video():
    video_path = 'videos/'+request.json['video_path']
    print(video_path)
    
    iter_video = vp.process_video(video_path)

    unique_tag = time.strftime('_%Y_%m_%d_%H%M%S_') # gives each set of videos a unique time stamp
    tensor_locs =  list()
    for processed_data in iter_video:
        tensor_locs.append(vp.save_tensor(processed_data, unique_tag))
        
    print(tensor_locs)
    response = make_response(jsonify({
        "message": "We have finished collecting all the reviews.",
        "tensor_locations": tensor_locs
    }), 200,)
    response.headers["Content-Type"] = "application/json"
    return response

@app.route('/upload-tensor', methods=['POST'])
def upload_to_s3():
    tensor_loc = request.json['tensor_location']
    print(tensor_loc)
    
    vp.upload_tensor(tensor_loc)
    response = make_response(jsonify({
        "message": f"Tensor {tensor_loc.split('_')[-1][0]} uploaded to the s3 bucket."
    }), 200,)
    response.headers["Content-Type"] = "application/json"
    return response

@app.route('/make-prediction', methods=['POST'])
def make_prediction():
    tensor_loc = request.json['tensor_location']
    print(tensor_loc)
    
    predictions = vp.call_model(tensor_loc)
    response = make_response(jsonify({
        "message": f"Predictions made on clip {predictions['clip_index']}.",
        "predictions": predictions,
    }), 200,)
    response.headers["Content-Type"] = "application/json"
    return response

@app.route('/download-video', methods=['POST'])
def download_vid():
    data = request.data[22:]
    print(request.data)
    
    file_name = 'videos/video' + time.strftime('%Y%m%d%H%M%S') + '.mp4 '
    
    fh = open(file_name, "wb")
    fh.write(base64.b64decode(data))
    fh.close()
    
    response = make_response(jsonify({
        "message": f"Video downloaded.",
        "file_name": file_name,
    }), 200,)
    response.headers["Content-Type"] = "application/json"
    return response

@app.route('/make-clip/<file_name>/<clip_index>', methods=['GET'])
def make_clip(file_name, clip_index):
    clip_index = int(clip_index)
    file_name =  f'videos/{file_name}'
    print(f'{file_name}, {clip_index}')
    vp.make_clip(file_name, clip_index)
    
    path = f'{file_name.split(".")[0]}-{clip_index}.mp4'
    print(path)
    
    return send_file(
        path,
        mimetype='video/mp4',
        as_attachment=True,
        download_name=file_name)
    
    # response = make_response(' ', 200,)
    # response.headers["Content-Type"] = "text/plain; charset=x-user-defined-binary"
    # return response

if __name__ == '__main__':
    app.run(debug=True)