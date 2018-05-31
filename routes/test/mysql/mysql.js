var config = require('../../../config/config.json');
//var config = require('../../../config.json');
var mysql = require('mysql');

var env = global.ENV;

//console.log('mysql ENV:',env, config[env]);

var connection = mysql.createConnection({
	  host     :  config[env]['mysql']['url'],
	  user     :  config[env]['mysql']['user'],
	  password :  config[env]['mysql']['password'],
	  database :  config[env]['mysql']['database'],
	  connectTimeout : 60000
});

connection.connect(function(err) {
	if (err) {
	  console.error('数据库连接失败: error connecting: ' + err.stack);
	  return;
	}
	console.log('Mysql连接成功：connected as id ' + connection.threadId);

});

//执行SQL,有callback
connection.toSQL =  function toSQL(sqlstr, callback){
	console.log('数据连接开始执行');
	connection.query(sqlstr, function(err, doc) {
		//console.log(doc);
		console.log('数据连接回调完成');
		return callback(err,doc);
	});

}

//执行SQL,无callback
connection.toSQL_noback =  function toSQL_noback(sqlstr){
	connection.query(sqlstr, function(err, doc) {
		if(err) console.log("MySql :toSQL_noback err:" + err);
	});
}





module.exports = connection;

