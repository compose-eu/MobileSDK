/*******************************************************************************
 Copyright 2014 CREATE-NET
 Developed for COMPOSE project (compose-project.eu)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 ******************************************************************************/
package org.compose.mobilesdk.android;

public class SO_channel {
	private String  name;
	private String  current_value;
	
	public SO_channel(String name, String current_value) {
		this.name = name;
		this.current_value = current_value;
	}
	
	public String getName() {
		return this.name;
	}
	
	public String getValue() {
		return this.current_value;
	}

}
