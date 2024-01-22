const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'))


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


app.post('/repos', async (req, res) => {
  const { username } = req.body;
  const perPage = 10;

  try {
   
    const userResponse = await axios.get(`https://api.github.com/users/${username}`);
    const user = userResponse.data;

    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      params: {
        per_page: perPage,
        page: 1,
      },
    });
    const repositories = reposResponse.data;

     
    res.send(renderPage(user, repositories, 1,perPage));
  } catch (error) {
    console.error('Error fetching GitHub data:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/repos', async (req, res) => {
  const { username, page } = req.query;
  const perPage = 10;

  try {  
    const userResponse = await axios.get(`https://api.github.com/users/${username}`);
    const user = userResponse.data;
    
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      params: {
        per_page: perPage,
        page: page || 1,
      },
    });
    const repositories = reposResponse.data;

    
    res.send(renderPage(user , repositories, page,perPage));
  } catch (error) {
    console.error('Error fetching GitHub data:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


function renderPage(user, repositories, currentPage,perPage) {
  const totalPages = Math.ceil(user.public_repos / perPage);

  
  const hasMorePages = (currentPage * perPage) < user.public_repos;

 
  const nextLink = hasMorePages
    ? `<a href="/repos?username=${user.login}&page=${parseInt(currentPage) + 1}" class="pagination-link">Next</a>`
    : '';
    
    
    const previousLink = currentPage > 1
      ? `<a href="/repos?username=${user.login}&page=${parseInt(currentPage) - 1}" class="pagination-link"> Previous</a>`
      : '';
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${user.login}'s GitHub Repositories</title>
        <style>
       
        .user-info {
          /* Additional styles for user information */
        }
      </style> 
      <link rel="stylesheet" type="text/css" href="/index.css">
      </head>
      <body>
      <div class="user-details">
      ${renderUserDetails(user)}
    </div>
        <div class="repositories-list">
        ${repositories.map(repo => `${renderRepositoryDetails(repo)}`).join('')}
        </div>
        <footer>
          ${previousLink}
          ${nextLink}
        </footer>
      </body>
      </html>
    `;
  }
  
  function renderRepositoryDetails(repo) {
    const description = repo.description ? `<p class="repository-description">${repo.description}</p>` : '';
    const topics = repo.topics && repo.topics.length > 0
    ? `<div class="topics"> ${repo.topics.map(topic => `<span class="topic">${topic}</span>`).join(', ')}</div>`
    : '';
  
    return ` 
      <div class="repository-item">  <h2 class="repository-name">${repo.name}</h2>
      ${description}
      ${topics}  </div>
     
    `;
  } 

  function renderUserDetails(user) {
    const bio = user.bio ? `<p>Bio: ${user.bio}</p>` : '';
    const location = user.location ? `<p>Location: ${user.location}</p>` : '';
  
    return `
    <div class="user-details-container">
      <img class="avatar" src="${user.avatar_url}" alt="GitHub Avatar">
      <div class="user-info">
        <h1>${user.login}</h1>
        ${bio}
        ${location}
      </div>
    </div>
  `;
  }
     

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});