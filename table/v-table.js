(function () {
	var vPager = {
		template: `<div class="v-pager">
			<span v-for="num in pagers" @click.stop="goto(num)" :class="{'cur': num==currentPage}">
				{{ num }}
			</span> / {{ totalPage }}
		</div>`,
		props: {
			currentPage: {type: [String, Number]},
		},
		computed: {
			totalPage: function () {
				return Math.ceil(this.$parent.totalCount / this.$parent.perPage);
			},
			pagers: function () {
				if(0 == this.$parent.totalCount) return [];

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
					this.$parent.turn(num);
				}
			}
		}
	};

	var vForm = {
		template: `<div v-show="showForm" class="v-form">

			<div class="v-mask"></div>
			<div class="v-fields">
				<p> {{ title }} </p>
				<p v-for="field in formFields">
					<label class="v-left"> {{ field.label }}:</label>
					<span>
						<label v-if="'radio' == field.type" v-for="(v, k) in field.map">
							<input type="radio" :name="field.name" :value="k" v-model="rowData[field.name]" /> {{ v }}
						</label>

						<label v-if="'checkbox' == field.type" v-for="(v, k) in field.map">
							<input type="checkbox" :value="k" v-model="rowData[field.name]" /> {{ v }}
						</label>

						<label v-if="'select' == field.type">
							<select v-model="rowData[field.name]">
								<option v-for="(v, k) in field.map" :value="k">{{ v }}</option>
							</select>
						</label>

						<label v-if="'text' == field.type || !field.type">
							<input type="text" v-model="rowData[field.name]" />
						</label>

						<span>{{ errors[field.name] }}</span>
					</span>
				</p>
				<p class="v-footer">
					<span class="v-button v-save" @click="save">Save</span>
					<span class="v-button v-cancel" @click="cancel">Cancel</span>
				</p>
			</div>
		</div>`,
		data: function () {
			return {
				showForm: false,
				rowData: {},
				errors: {},
			}
		},
		methods: {
			setData: function (row) {
				this.rowData = JSON.parse(JSON.stringify(row));
				for(i in this.formFields) {
					var _field = this.formFields[i], _name = _field.name;
					var _default = _field.default;
					if('checkbox' == _field.type) {
						_default = _default.split('|');
					}

					if('undefined'  == typeof this.rowData[_name]) {
						this.rowData[_name] = _default;
					}
				}
			},
			setError: function (info) {
				this.errors = JSON.parse(JSON.stringify(info));
			},
			save: function () {
				this.errors = {};
				this.$parent.saveData(this.rowData);
			},
			cancel: function () {
				this.showForm = false;
				this.rowData = {};
				this.errors = {};
			}
		},
		computed: {
			formFields: function () {
				var _arr = {};
				for(i in this.$parent.fields) {
					var _field = this.$parent.fields[i];
					if('id' == _field.name) continue;
					if(_field.hasOwnProperty('action')) continue;
					_field.default = _field.default || '';
					_arr[i] = _field;
				}
				return _arr;
			},
			title: function () {
				if(this.rowData.id) {
					return 'Edit';
				} else {
					return 'New';
				}
			}
		}
	};

	var vTable = {
		template: `<div class="v-table">
			<p><span class="v-button" @click.stop="create">New</span></p>

			<table>
				<tr><th v-for="field in fields">{{field.label}}</th></tr>
				<tr v-for="row in tableData">
					<td v-for="field in fields">
						{{ '' | render(field, row)  }}
							<span v-if="field.action" class="v-action" v-for="(action_func, action_text) in field.action"  @click.stop="fireAction(action_func, row, $event)">
								{{ action_text }}
							</span>
					</td>
				</tr>
			</table>
			<v-pager :current-page="currentPage"></v-pager>
			<v-form ref="form"></v-form>
		</div>`,
		props: {
			dataUrl: {type: String, required: true},
			perPage: {type: [String, Number], default: 10},
		},
		components: {
			'v-pager': vPager,
			'v-form': vForm,
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

				if('checkbox' == field.type) {
					var arr = [];
					for(i in value) {
						arr.push(field.map[value[i]])
					}
					return arr.join(', ')
				} else if(field.hasOwnProperty('map')) {
					return field.map[value];
				} else if(field.hasOwnProperty('lambda')) {
					return field.lambda(value, row);
				}
				return value;
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
			turn: function (num) {
				this.currentPage = num;
				this.getData();
			},
			getData: function () {
				this.$http.get(this.dataUrl, {params: {'page': this.currentPage, 'perPage': this.perPage}}).then( function(response) {
					this.tableData = response.data.data;
					this.totalCount = response.data.totalCount;
				});
			},
			saveData: function (rowData) {
				this.$http.post(this.dataUrl, rowData).then(function (response) {
					if(0 == response.data.error) {
						this.getData();
						this.$refs.form.showForm = false;
					} else {
						this.$refs.form.setError(response.data.info);
					}
				})
			},
			removeData: function (id) {
				this.$http.delete(this.dataUrl, {params: {'id': id}}).then(function (response) {
					if(0 == response.data.error) {
						this.getData();
						this.$refs.form.showForm = false;
					}
				})
			},
			create: function () {
				this.$refs.form.setData({});
				this.$refs.form.showForm = true;
			},
			fireAction: function (func, rowData, event) {
				var action = func(rowData['id']);
				if('edit' == action) {
					this.$refs.form.setData(rowData);
					this.$refs.form.showForm = true;
				} else if('remove' == action) {
					if(confirm('Sure to remove?')) {
						this.removeData(rowData['id']);
					}
				}
			},
		}
	};

	Vue.component('v-table', vTable);
})();
