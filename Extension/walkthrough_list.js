// The main Walkthrough object
Walkthrough = {};

// node id for walkthrough element
var $walkthrough_nid;

// list of walkthrough items
var $walkthrough_node_list;

// a walkthrough item
var $walkthrough_list_item;

// ajax URL for walkthrough listing service
var $walkthrough_service_url = 'http://walkthrough.pronovix.net/api/v1/views/walkthrough_list';

// ajax URL for step listing service
var $step_service_url = 'http://walkthrough.pronovix.net/api/v1/views/step_list?args[]=';

// command object
var $scommand;

// array for commands
var $commands;


/**
 * Walkthrough list generator object.
 */
function requestWalkthrough() {
  try {
    $.ajax({
      url: $walkthrough_service_url,
      type: 'get',
      dataType: 'json',
      error: function(jqXHR, textStatus, errorThrown) {
        alert('walkathrough_list - failed to retrieve the walkthrough list');
        console.log(JSON.stringify(jqXHR));
        console.log(JSON.stringify(textStatus));
        console.log(JSON.stringify(errorThrown));
      },
      success: function(data) {
        // clear the walkthrough_node_list ul
        $walkthrough_node_list = $('#walkthrough_node_list').html('');
        // iteration on the walkthrough node
        $.each(data, function(node_index, node_value) {
          console.log(node_index + ' : ' + JSON.stringify(node_value));
          // getting the walkthrough node id
          $walkthrough_nid = node_value.nid;
          // creating the list item
          $walkthrough_list_item = $('<li class=\"walkthrough_list_item_title\" id=\"' + $walkthrough_nid + '\" onclick=\"requestStep\(' + $walkthrough_nid + '\)\">' + node_value.title + '</li>');
          // append the item
          $walkthrough_node_list.append($walkthrough_list_item);
        });
      }
    });
  }
  catch(error) {
    alert('walkthrough_list - ' + error);
  }
}


/**
 * Step list generator function.
 */
function requestStep(nid) {
  try {
    $.ajax({
      url: $step_service_url + nid,
      type: 'get',
      dataType: 'json',
      error: function(jqXHR, textStatus, errorThrown) {
        alert('step_list - failed to retrieve the requested step list');
        console.log(JSON.stringify(jqXHR));
        console.log(JSON.stringify(textStatus));
        console.log(JSON.stringify(errorThrown));
      },
      success: function(data) {
        console.log('success');
        $commands = new Array();
        $.each(data, function(node_index, node_value) {
          console.log(node_index + ' : ' + JSON.stringify(node_value));
          $command = {
            title : node_value.title,
            description : node_value.description,
            command : node_value.field_command_1,
            // pureCommand
            arg1 : node_value.field_command_2,
            arg2 : node_value.field_command_3,
            highlight : node_value.step_highlight
            // andWait
          }
          $commands.push($command);
        });
        console.log($commands);
      }
    });
  }
  catch(error) {
    alert('requested_step_list - ' + error);
  }
}


/**
 * Executes a command
 *
 * @param command
 *    Object with the following keys:
 *    string title
 *    string description
 *    string command
 *    string pureCommand
 *    string arg1
 *    string arg2
 *    string highlight
 *    bool andWait
 */
function execute(command) {

}

/**
 * Generating the initial walkthrough list.
 */
document.addEventListener('DOMContentLoaded', function() {
  requestWalkthrough();
});
