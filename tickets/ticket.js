document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Auth0
  const auth0 = await createAuth0Client({
    domain: "dev-8hl0yvtyxunzhqc3.eu.auth0.com",
    client_id: "DJqDHxzBc7gJZx4ZzgLH9K9lYOVkq7Aj",
    redirect_uri:
      "https://web2-ticket.onrender.com/tickets/d376b2df-5a78-4b03-b68c-d7a9fcb25dd8"
  });

  // Check if the user is logged in
  const isAuthenticated = await auth0.isAuthenticated();
  const logoutButton = document.getElementById("logout");
  // Handle authentication state
  if (!isAuthenticated) {
    auth0.loginWithPopup().then((token) => {
      auth0.getUser().then((user) => {
        console.log(user);
      });
    });
  }
  // Display logout button
  logoutButton.style.display = "block";
  console.log("Logged in!");

  const user = await auth0.getUser();
  const accessToken = await auth0.getTokenSilently();

  const path = window.location.pathname;
  const parts = path.split("/");
  const ticketId = parts[parts.length - 1];

  try {
    const response = await fetch(`/ticket-info/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error fetching ticket details");
    }

    const data = await response.json();

    // Populate the ticket details on the page
    document.getElementById("ticketVatin").innerText = data.vatin;
    document.getElementById(
      "ticketName"
    ).innerText = `${data.firstName} ${data.lastName}`;
    document.getElementById("ticketTime").innerText = new Date(
      data.createdAt
    ).toLocaleString();
    document.getElementById("userName").innerText = user.name;
    document.getElementById("ticketSection").style.display = "block";
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("errorSection").style.display = "block";
  }
  // Logout handler
  logoutButton.addEventListener("click", () => {
    auth0.logout({
      returnTo: window.location.origin,
    });
  });
});
