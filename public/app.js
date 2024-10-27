document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch('/tickets/count'); // Poziva backend endpoint
      const data = await response.json();
  
      if (response.ok) {
        document.getElementById('ticketCount').innerText = data.count;
      } else {
        console.error('Error fetching ticket count:', data.error);
      }
  
    } catch (error) {
      console.error('Fetch error:', error);
    }
});

document.getElementById('ticketForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const vatin = document.getElementById('vatin').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
  
    const response = await fetch('/tickets/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ vatin, firstName, lastName }),
    });
  
    const data = await response.json();
  
    if (response.status === 201) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'UTC' 
        };

        const formattedDate = new Date(data.ticket.createdat).toLocaleString('hr-HR', options);
        document.getElementById('ticketVatin').innerText = data.ticket.vatin;
        document.getElementById('ticketName').innerText = `${data.ticket.firstname} ${data.ticket.lastname}`;
        document.getElementById('ticketTime').innerText = formattedDate;
        document.getElementById('qrCode').innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
        document.getElementById('ticketSection').style.display = 'block';
    } else {
        alert('Error: ' + data.error);
    }
  });