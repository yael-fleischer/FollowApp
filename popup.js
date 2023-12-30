document.getElementById('uploadButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        uploadFile(file);
    } else {
        alert('Please select a file first.');
    }
});

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with a ${response.status} status`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            document.getElementById('status').innerText = 'File uploaded and transcription completed!';
            
            // Check if the summary link exists in the response
            if (data.summaryLink) {
                // Create a clickable link for the user to view the summary
                const summaryLinkElem = document.createElement('a');
                summaryLinkElem.href = data.summaryLink;
                summaryLinkElem.target = "_blank"; // To open the link in a new tab
                summaryLinkElem.innerText = "View Summary";
                document.body.appendChild(summaryLinkElem);
            }
        } else {
            document.getElementById('status').innerText = 'Error during upload.';
        }
    })
    .catch(error => {
        console.error('There was an error uploading the file.', error);
        document.getElementById('status').innerText = 'Upload failed, please try again.';
    });
}
