const express =  require('express');
const app = express();
const {v4: uuidV4 } =  require('uuid');

app.use(express.static('public'));

app.set('views','./views');
app.set('view engine','ejs');

app.get('/',(req,res)=>{ 
    res.redirect(`/${uuidV4()}?sharescreen=false`);
});

app.get('/:room',(req,res)=>{
    const { sharescreen } = req.query;
    let route;

    sharescreen === 'false' || sharescreen === undefined  ? route = 'room' : route = 'sharescreen' ;

    res.render(route,{ roomId : req.params.room })
});

module.exports = app;
