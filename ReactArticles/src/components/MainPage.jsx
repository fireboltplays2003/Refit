import React from 'react';
import { Link } from 'react-router-dom';

import '../assets/styles/MainPage.css';

function MainPage() {
  const articles = [
    {
      id: 1,
      title: 'Understanding JavaScript',
      content:
        'JavaScript is a versatile programming language used for both front-end and back-end development.',
      img: 'https://loremflickr.com/200/200?random=1',
    },
    {
      id: 2,
      title: 'The Future of Web Development',
      content:
        'Web development is evolving with new technologies like WebAssembly, React, and serverless architecture.',
      img: 'https://loremflickr.com/200/200?random=1',
    },
    {
      id: 3,
      title: 'Exploring Artificial Intelligence',
      content:
        'Artificial Intelligence is transforming industries and is expected to change the way we work and live.',
      img: 'https://loremflickr.com/200/200?random=1',
    },
    {
      id: 4,
      title: 'Getting Started with Python',
      content:
        'Python is a powerful programming language known for its simplicity and readability, making it perfect for beginners.',
      img: 'https://loremflickr.com/200/200?random=1',
    },
  ];
  return (
    <div className='main'>
      <section className='articles'>
        <div className='container'>
          <h1 className='main-page-title'>Articles</h1>

          <div className='articles-container'>
            {articles &&
              articles.map(article => (
                <div key={article.id} className='article-card'>
                  <img
                    src={article.img}
                    alt={article.title}
                    className='article-image'
                  />
                  <h2 className='article-title'>{article.title}</h2>
                  <div className='d-flex g-1'>
                    <Link to={`/post/${article.id}`} className='view-button'>
                      View
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default MainPage;
