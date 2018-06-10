var express = require('express');
var router = express.Router();
var config = require('../../config/config.json');
var EventProxy =   require('eventproxy');
//var Promise =  require('Promise');

var env = global.ENV;
console.log('test ENV:', env);

var mysql = require('./mysql/mysql.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.send("node.js测试研究专用资源");
});


/* 试验 node.js单线程 事件回调机制  */
/* 输出如下:

    --测试开始
    --事件1开始执行
    --事件1复杂计算数据: dfjiejmdkfjkjeuhkdnkfjdkjkdfheiujkmdfsk
    --数据连接开始执行
    --事件2开始执行
    --事件2回调完成: event2 ok
    --x1= 0
    --代码最后一行    
    --GET /test/eventTest 200 7.850 ms - 833
    --数据连接回调完成
    --数据库查询回调完成
    --事件1回调完成: [ RowDataPacket { userID: '11111', name: 'yuruo', numb: 1 },
    --  RowDataPacket { userID: '22222', name: 'mx', numb: 2 },
    --  RowDataPacket { userID: '33333', name: 'lixia', numb: 3 },
    --  RowDataPacket { userID: '55555', name: 'fuxuezhen', numb: 5 },
    --  RowDataPacket { userID: '66666', name: 'maxuanhong', numb: 6 } ]
    --x2= 1
*/
router.get('/eventTest',eventTest );

function eventTest(req,res,next){
    var content = '2个回调函数,让函数1回调慢并且在函数体内执行复杂计算并嵌套回调函数(数据库连接)，函数2回调快，测试哪个回调先输出.  ';
    
    console.log('测试开始');
    //事件1：执行速度慢
    event1(function(data2){ 
        console.log('事件1回调完成:',data2 );
        console.log('x2=',x);
    });
      var x=0
     //事件2： 执行速度快 
     event2(function(data2){ 
        console.log('事件2回调完成:',data2 );
        console.log('x1=',x);
    });

     x=1
    console.log("代码最后一行");
    var result =" <br> 测试结果：<br>  1.函数依此被调用， 函数体的代码依此被执行属于同步运行(并不因为函数体内计算量大而异步)，函数体内若仍有调用函数优先执行嵌套函数体内代码。"+
                  " <br>2.而回调返回各自时间不一样，“回调函数(整个回调函数体)”进入事件队列等待轮询， 当线程空闲即开始逐个执行。 " + 
                  " <br>3.线程空闲是指在每行代码在执行前检查回调函数事件栈，这就是为什么最后输出x1=0,x2=1,及\"事件2回调完成: event2 ok\"在'代码最后一行'优先输出； 原因即 '代码最后一行'执行前线程空闲，优先执行的回调函数栈";
    return res.send(content + result);
}

    function  event1(callback){ /*回调事件:快速返回 */
        console.log('事件1开始执行');

        var tt = 10002*50005*52/6888-88
        var s1='dfjiejmdkfjkj'
        var s2='euhkdnkfjdkjk' 
        var s3='dfheiujkmdfsk'
        var s5=88/99*88+99*802+99*85+6253+9987+66520*889920/80-925652+6*8672511*986554569+6200123258+78552152/8857+995210+63250

        s3= s1 +s2 +s3

        console.log('事件1复杂计算数据:' , s3 );

        //console.log(tt);
        //return callback(tt);
        mysql.toSQL("select * from user ", function(err,datas){
            console.log("数据库查询回调完成");
           return callback(datas);
        })  
    }

    function  event2(callback){ /*回调事件:快速返回 */
        console.log('事件2开始执行');
        return callback('event2 ok');
    }






/*分析eventProxy的原理，及分析代码写法  */

router.get('/epTest', epTest );

function epTest(req,res,next){
    var ep =  new EventProxy();
     
   /*1. ep的函数用法 */
        // ep.addListener('e1',function(data1){
        //     console.log('e1回掉了:', data1,ep);
        //     ep.removeListener('e2');
        //     ep.emit('e3', '传递给e3的数据');
        // });

        // ep.bind('e2',function(data2){
        //     console.log('e2回掉了:', data2,ep);
        //     ep.emit('e1', '传递给e1的数据')
        // });

        // ep.on('e3',function(data3){
        //     console.log('e3回掉了:', data3,ep);
        //     ep.emit('e2', '传递给e2的数据');
        // });

        // ep.all('e4',function(data4){
        //     console.log('e4回掉了:', data4,ep);
        //     ep.emit('e3', '传递给e3的数据');
        // });

        // console.log(ep);
        // //ep.emit('e1', '传递给e1的数据');
        // ep.emit('e4', '传递给e4的数据');
        
        
    /*2.分析ep的代码实现 */
 
        // ep.bind('e1',function(data1){
        //     console.log('e1回掉了:', data1,ep);
        // });
        // ep.emit('e1', '传递给e1的数据')


     /*3.语法分析 */
        //一.包围函数
            // (function(i,n){
            //      console.log("包围函数:",i,n);
            //      var t=new n; t.newStr('new Value;'); 
            // })('HH', function(){
            //      this.str='6'; 
            //      this.newStr = function(newString){ this.str=newString; console.log("newString:",newString);  } 
            //      return this;
            // });

        //二.process.nextTick 用法：
        //Node.js是单线程的，除了系统IO之外，在它的事件轮询过程中，同一时间只会处理一个事件。把事件轮询想象成一个大的队列，在每个时间点上，系统只会处理一个事件。
        //即使你的电脑有多个CPU核心，你也无法同时并行的处理多个事件。但也就是这种特性使得node.js适合处理I／O型的应用，不适合那种CPU运算型的应用。
        //在每个I／O型的应用中，你只需要给每一个输入输出定义一个回调函数即可，他们会自动加入到事件轮询的处理队列里
        //当I／O操作完成后，这个回调函数会被触发。然后系统会继续处理其他的请求。
            // function foo()  {
            //     console.error('foo：',arguments);
            //     //return callback();
            // }
            // //foo('a','b');
            // process.nextTick(()=>{  foo(1,2);  });
            // //foo('a','b');
            // var a=5;
            // console.error('bar');
                //输出结果： foo bar  



        //三：promise用法: promise的then()方法是开始执行回调；完成后返回一个新promise对象。
        //做饭
        function cook(){
            console.log('开始做饭。');
            var p = new Promise(function(resolve, reject){        //做一些异步操作
                setTimeout(function(){
                    console.log('做饭完毕！');
                    resolve('鸡蛋炒饭');
                }, 1000);
            });
            return p;
        }
       
        //吃饭
        function eat(data){
            console.log('开始吃饭：' + data);
            var p = new Promise(function(resolve, reject){        //做一些异步操作
                setTimeout(function(){
                    console.log('吃饭完毕!');
                    resolve('一块碗和一双筷子');
                }, 2000);
            });
            return p;
        }

        function wash(data){
            console.log('开始洗碗：' + data);
            var p = new Promise(function(resolve, reject){        //做一些异步操作
                setTimeout(function(){
                    console.log('洗碗完毕!');
                    resolve('干净的碗筷');
                }, 2000);
            });
            return p;
        }

        cook()
        .then(eat)
        .then(wash)
        .then(function(data){
            console.log(data);
        });





    var result =" <br> 测试结果：<br>一：ep的函数用法 <br>  1. ep.all, 执行后会将此事件队列中移除; 而ep.addList .bind .on执行后不移除，只要触发依然执行。  "+
    " <br> 2. ep的事件队列可以通过： ep._callbacks中查看。 " + 
    " <br> 3. 事件队列可以通过ep.removeListener  ep.unbind移除 " + 
    "<br><br> 二：分析ep的代码实现 "+ 
    "<br>  1. 当有事件绑定时, ep会将函数以参数传入addListener方法,并将函数对象(callback)存储在 _callbacks （JSON）数据中 " + 
    "<br>  2. 随后ep对象执行emit函数（调用trigger），ep会从 _callbacks 中提取对应的事件函数， 并通过函数对象的 .apply方法对回调函数传参数并执行 " + 
    "<br><br> 语法分析：<br>一：包围函数： (function(i,n){ xxx })(i,n); 第二个括号为立即执行并传递参数i,n ,作用是可以用它创建命名空间，只要把自己所有的代码都写在这个特殊的函数包装内，那么外部就不能访问，避免污染外部空间。  " + 
    "<br>二：js的prototype，是实现面向对象的一个重要机制。每个函数也是一个对象，它们对应的类就是function，每个函数对象都具有一个子对象prototype prototype表示了一个类的属性的集合。当通过new来生成一个类的对象时，prototype对象的属性就会成为实例化对象的属性。" +
    "<br>  ***   EventProxy.prototype.bindForAll = function (callback) {this.bind(ALL_EVENT, callback);}   ***  "+
    "<br><br>三.arguments为函数的一个参数的JSON数据" +
    "<br><br>四.Promise用法   " + 
    "<br> 1.promise的then()方法是开始执行回调；完成后返回一个新promise对象； " +
    "<br> 2.resolve(data)是返回成功后的状态并将data参数网下个函数传递  "


    return res.send( result);

}
















module.exports = router;




