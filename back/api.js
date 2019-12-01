let express=require('express');
let bodyParser=require('body-parser');
let jwt=require('jwt-simple');
let cors=require('cors');
let session=require('express-session');
let MongoStore=require('connect-mongo')(session);
let config=require('./config/dev');
let app=express();
app.use(cors({
    origin:['http://localhost:8000'],
    credentials:true,
    allowedHeaders:'Content-Type,Authorization',
    methods:'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
}));
app.use(session({
    secret:'zhufeng',
    resave:true,
    saveUninitialized:true,
    store:new MongoStore({
        url:config.dbUrl,
        mongoOptions:{
            useNewUrlParser:true,
            useUnifiedTopology:true
        }
    })
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/api/login/captcha',async (req,res)=>{
    let mobile=req.query.mobile;
    let captcha=rand();
    req.session.captcha=captcha;
    await sendCode(mobile,captcha);
    res.json({code:0,data:`[仅限测试环境验证码]：${captcha}`})
});

app.post('/api/register',async(req,res)=>{
    let user=req.body;
    if(user.captcha != req.session.captcha){
        return res.json({code:1,error:'验证码不正确'})
    }
    let avatarValue=require('crypto').createHash('md5').update(user.mail).digest('hex');
    user.avatar=`https://secure.gravatar.com/avatar/${avatarValue}?s=48`
    user=await UserModel.create(user);
    res.send({status:'ok',currentAuthority:'user'});
});

app.post('/api/login/account',async (req,res)=>{
    let user=req.body;
    let query={};
    if(user.type=='account'){
        query.mail=user.mobile;
    }else if(user.type=='mobile'){
        query.mobile=user.mobile;
        if(user.captcha!=req.session.captcha){
            return res.send({
                status:'error',
                type:user.type,
                currentAuthority:'guest'
            })
        }
    }
    let dbUser=await Models.UserModel.findOne(query);
    if(dbUser){
        dbUser.userid=dbUser._id;
        dbUser.name=dbUser.mail;
        let token=jwt.encode(dbUser,config.secret);
        res.send({status:'ok',token,type:user.type,currentAuthority:dbUser.currentAuthority})
    }else{
        return res.send({
            status:'error',
            type:user.type,
            currentAuthority:'guest'
        });
    }
});

app.get('/api/currentUser',async (req,res)=>{
    let authorization=req.headers['authorization'];
    if(authorization){
        try{
            let user=jwt.decode(authorization.split(' ')[1],config.secret);
            user.userid=user._id;
            user.name=user.mail;
            res.json(user);
        }catch(err){
            res.status(401).send({})
        }
    }else{
        res.status(401).send({})
    }
})


app.listen(4000,()=>{
    console.log('服务器在4000端口启动！');
});

function rand() {
    let min = 1000, max = 9999;
    return Math.floor(Math.random() * (max - min)) + min;
}