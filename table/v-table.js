(function () {
	var vPager = {
		template: `<div class="v-pager">
			<span v-for="num in pagers" @click.stop="goto(num)" :class="{'cur': num==currentPage}">
				{{ num }}
			</span> / {{ totalPage }}
		</div>`,
		props: {
			totalCount: {type: [Number, String], required: true},
			perPage: {type: [String, Number], required: true},
		},
		data: function () {
			return {
				totalPage: 0,
				currentPage: 1,
			};
		},
		computed: {
			totalPage: function () {
				return Math.floor(this.totalCount / this.perPage) + 1;
			},
			pagers: function () {
				var arr = [];

				if(1 != this.currentPage) {
					arr.push('<<');
					arr.push('<');
				}

				var start = Math.max(this.currentPage - 3, 1);
				for (var i = 0; i < 7; i++) {
					if(i + start > this.totalPage) break;
					arr.push(i + start);
				}

				if(this.totalPage != this.currentPage) {
					arr.push('>');
					arr.push('>>');
				}

				return arr;
			}
		},
		methods: {
			goto: function (num) {
				var map = {
					'<<': 1,
					'<': this.currentPage - 1,
					'>': this.currentPage + 1,
					'>>': this.totalPage,
				};
				if(map.hasOwnProperty(num)) {
					num = map[num];
				}

				if(num != this.currentPage) {
					this.$emit('turn', num);
					this.currentPage = num;					
				}
			}
		}
	};

	Vue.component('v-table', {
		template: `<div class="v-table">
			<table>
				<tr><th v-for="field in fields">{{field.label}}</th></tr>
				<tr v-for="row in tableData">
					<td v-for="field in fields">
						{{ '' | render(field, row)  }}
						<template v-if="field.action">
							<span v-for="(action_func, action_text) in field.action" @click.stop="fireAction(action_func, row, $event)">
								{{ action_text }}
							</span>
						</template>
					</td>
				</tr>
			</table>
			<v-pager :total-count="totalCount" :per-page="perPage" v-on:turn="turn"></v-pager>
		</div>`,
		props: {
			dataUrl: {type: String, required: true},
			perPage: {type: [String, Number], default: 10},
		},
		components: {
			'v-pager': vPager,
		},
		data: function () {
			return {
				totalCount: 0,
				currentPage: 1,
				fields: [],
				tableData: [],
			}
		},
		filters: {
			render: function (value, field, row) {
				value = row[field.name];

				// console.log(field)
				if(field.hasOwnProperty('map')) {
					return field.map[value];
				} else if(field.hasOwnProperty('lambda')) {
					return field.lambda(value, row);
				}
				return value
			}
		},
		mounted: function () {
			this.initFields();
			this.getData();
		},
		methods: {
			initFields: function () {
				if(this.fields.length > 0) return;
				var _fields = [], child;

				for(i in this.$slots.default) {
					child = this.$slots.default[i];
					if('column' == child.tag) {
						var _arr = {}, attrs = child.data.attrs;
						for(j in attrs) {
							if('map' == j) {
								_arr[j] = (new Function('return ' + attrs.map))();
							} else if ('lambda' == j) {
								_arr[j] = (new Function('value', 'row', attrs.lambda));
							} else if ('action' == j) {
								var action = (new Function('return ' + attrs.action))();
								for(k in action) {
									action[k] = (new Function('id', action[k]))
								}
								_arr[j] = action;
							} else {
								_arr[j] = attrs[j];
							}
						}
						_fields.push(_arr);
					}
				}
				this.fields = _fields;
			},
			getData: function () {
				this.$http.get(this.dataUrl, {params: {'page': this.currentPage}}).then( function(response) {
					this.tableData = response.data.data;
					this.totalCount = response.data.totalCount;
				});
			},
			fireAction: function (func, row, event) {
				func(row['id']);
			},
			turn: function (num) {
				this.currentPage = num;
				this.getData();
			},
		}
	});
})();
