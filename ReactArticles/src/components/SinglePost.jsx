import React from 'react';

import '../assets/styles/SinglePost.css';

function SinglePost() {
  const post = {
    id: 1,
    title: 'Understanding JavaScript',
    content:
      'JavaScript is a versatile programming language used for both front-end and back-end development.',
    img: 'https://loremflickr.com/200/200?random=1',
  };

  return (
    <div className='main'>
      <section className='post'>
        {post ? (
          <div className='container'>
            <div className='single-post'>
              <h1 className='post-title'>{post.title}</h1>
              <img src={post.img} alt={post.title} className='post-image' />
              <p className='post-content'>{post.content}</p>
            </div>
          </div>
        ) : (
          <div className='container'>
            <p>No data</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default SinglePost;
