export function transcriber () {

    let mediaRecorder;
    let audioChunks = [];

    function updateDebug(message) {
        const debug = document.getElementById('debug');
        debug.textContent += new Date().toISOString() + ': ' + message + '\n';
    }

    document.getElementById('startRecording').onclick = async () => {
        try {
            updateDebug('Requesting microphone access');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000
                }
            });

            updateDebug('Microphone access granted');

            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            updateDebug('MediaRecorder created with settings: ' +
                JSON.stringify(mediaRecorder.audioBitsPerSecond));

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
                updateDebug('Chunk received: ' + event.data.size + ' bytes');
            };

            mediaRecorder.onstop = async () => {
                updateDebug('Recording stopped');
                const audioBlob = new Blob(audioChunks, {
                    type: 'audio/webm;codecs=opus'
                });
                updateDebug('Blob created: ' + audioBlob.size + ' bytes');

                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                updateDebug('FormData created with audio file');

                try {
                    document.getElementById('status').textContent = 'Sending to server...';
                    updateDebug('Sending to server...');

                    const response = await fetch('/transcribe', {
                        method: 'POST',
                        body: formData
                    });

                    updateDebug('Server response status: ' + response.status);

                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}`);
                    }

                    const data = await response.json();
                    updateDebug('Server response: ' + JSON.stringify(data));

                    document.getElementById('status').textContent =
                        `Transcription: ${data.transcription}`;
                } catch (error) {
                    console.error('Error:', error);
                    updateDebug('Error: ' + error.message);
                    document.getElementById('status').textContent =
                        `Error transcribing audio: ${error.message}`;
                }
            };

            mediaRecorder.start(1000); // Collect data every second
            updateDebug('Recording started');
            document.getElementById('startRecording').disabled = true;
            document.getElementById('stopRecording').disabled = false;
            document.getElementById('status').textContent = 'Recording...';
            audioChunks = [];
        } catch (error) {
            console.error('Error:', error);
            updateDebug('Error: ' + error.message);
            document.getElementById('status').textContent =
                `Error accessing microphone: ${error.message}`;
        }
    };

    document.getElementById('stopRecording').onclick = () => {
        mediaRecorder.stop();
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('status').textContent = 'Processing...';
        updateDebug('Stop button clicked');
    };
}