var express = require('express');
var router = express.Router();
var config = require('../../config/config.json');


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



module.exports = router;




