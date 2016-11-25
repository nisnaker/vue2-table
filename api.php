<?php

class Api
{
	function __construct()
	{
		header('Content-Type: application/json');
		usleep(500000);
	}

	public function run()
	{
		if(isset($_GET['action'])) {
			$action = $_GET['action'];
			$action = 'action' . ucfirst($action);
			if(method_exists($this, $action)) {
				return $this->$action();
			}
		}

		$method = $_SERVER['REQUEST_METHOD'];
		$method = strtolower($method);
		$this->$method();
	}

	public function get()
	{
		$len = min($_GET['perPage'], 20);
		$offset = ($_GET['page'] - 1) * $len;

		$data = $this->getData();

		echo json_encode([
			'totalCount' => count($data),
			'data' => array_slice($data, $offset, $len),
			'counter' => $_GET['counter'],
		]);
	}

	function post()
	{
		$_POST = json_decode($GLOBALS['HTTP_RAW_POST_DATA'], true);
		$this->validate($_POST);
		
		$data = $this->getData();

		$id = $_POST['id'];
		if(!$id) {
			$id = 1;
			if($data) {
				$id = array_values($data)[0]['id'] + 1;
			}
			$_POST['id'] = $id;
		}

		$data[$id] = $_POST;
		$this->saveData($data);

		echo json_encode([
			'error' => 0,
			'msg' => 'ok',
		]);
	}

	public function delete()
	{
		$id = $_GET['id'];
		$data = $this->getData();
		unset($data[$id]);
		$this->saveData($data);

		echo json_encode([
			'error' => 0,
			'info' => 'ok',
		]);
	}

	private function validate($item)
	{
		foreach (['name', 'price', 'tags'] as $field) {
			if(!isset($item[$field]) || !$item[$field]) {
				$info[$field] = 'field required';
			}
		}

		if($info) {
			echo json_encode([
				'error' => 1,
				'info' => $info,
			]);
			die;
		}
	}

	private function getData()
	{
		$file = 'data.php';
		$data = [];
		if(file_exists($file)) {
			$data = require $file;
		}
		return $data;
	}

	private function saveData($data)
	{
		$file = 'data.php';
		krsort($data);
		file_put_contents($file, '<?php return ' . var_export($data, true) . ';');
	}

	private function actionTags()
	{
		header('Content-Type: application/json');

		echo json_encode([
			1 => 'tag11',
			2 => 'tag22',
			3 => 'tag33',
		]);
	}

	private function initData()
	{
		$str = '["问与答","分享发现","分享创造","分享邀请码","自言自语","奇思妙想","随想","设计","Blog","V2EX","Project Babel","DNS","反馈","Google App Engine","使用指南","iDev","iCode","iMarketing","iAd","iTransfer","程序员","Python","Android","Linux","宽带症候群","PHP","云计算","外包","硬件","服务器","Java","Bitcoin","MySQL","Linode","编程","设计师","汽车","Kindle","Markdown","Tornado","Ruby on Rails","MongoDB","字体排印","Redis","Ruby","商业模式","数学","Photoshop","LEGO","SONY","自然语言处理","游戏","Steam","iGame","英雄联盟","PlayStation 4","Battlefield 3","StarCraft 2","PlayStation 3","World of Warcraft","EVE","Xbox 360","Battlefield 4","Gran Turismo","Wii","macOS","iPhone","MacBook Pro","iPad","配件","MacBook Air","MacBook","iMac","Mac mini","iPod","Mac Pro","MobileMe","iWork","iLife","GarageBand","二手交易","酷工作","天黑以后","免费赠送","音乐","电影","物物交换","剧集","信用卡","美酒与美食","团购","投资","旅行","阅读","摄影","绿茵场","Baby","宠物","咖啡","乐活","骑行","非诚勿扰","日记","植物","蘑菇","行程控","Google","Twitter","Coding","Facebook","Wikipedia","reddit","北京","上海","深圳","杭州","广州","成都","武汉","昆明","天津","New York","San Francisco","青岛","Los Angeles","Boston","UNIQLO","Lamy","宜家","无印良品","Gap","Nike","Moleskine","Adidas","G-Star"]';

		$arr = json_decode($str, true);
		shuffle($arr);
		$data = [];
		$i = 1;
		foreach ($arr as $name) {
			$data[$i] = [
				'id' => $i,
				'name' => $name,
				'price' => rand(1111, 9999),
				'status' => rand(0, 1),
			];
			$i++;
		}


		krsort($data);
		file_put_contents('data.php', '<?php return ' . var_export($data, true) . ';');
	}
}

$api = new Api();
$api->run();