fetch('http://localhost:3000/')
  .then(res => {
    console.log('Status:', res.status);
    return res.text();
  })
  .then(text => {
    console.log(text.slice(0, 2000));
  })
  .catch(err => {
    console.error(err);
  });
