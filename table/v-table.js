(function () {
	Vue.component('v-table', {
		template: `<table class="v-table">
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
		</table>`,
		props: {
			dataUrl: {type: String, required: true},
		},
		data: function () {
			return {
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
			this.getData(0);
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
			getData: function (page) {
				this.$http.get(this.dataUrl).then( function(response)  {
					var data = JSON.parse(response.body);
					this.tableData = data.tableData;
				});
			},
			fireAction: function (func, row, event) {
				func(row['id']);
			}
		}
	});
})();
