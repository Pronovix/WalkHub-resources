// var $step_node_list;
// a step item
// var $step_list_item;
// ajax URL
// var $step_url = 'http://walkthrough.pronovix.net/api/v1/views/step_list?args[]=3';

//var step_list_generator = {
//  requestStep: function() {
    /*try {
      $.ajax({
        url: $url,
        type: 'get',
        dataType: 'json',
        error: function (jqXHR, textStatus, errorThrown) {
          alert('step_list - failed to retrieve the step_list_generator list');
          console.log(JSON.stringify(jqXHR));
          console.log(JSON.stringify(textStatus));
          console.log(JSON.stringify(errorThrown));
        },
        success: function (data) {
          // clear the step_node_list ul
          $step_node_list = $('#step_node_list').html('');
          // iteration on the step node
          $.each(data, function(node_index, node_value) {
            console.log(node_index + ' : ' + JSON.stringify(node_value));
            // creating the list item
            // id='" + node_value.node.Nid + "'
            $list_item = $('<li></li>',{"html":"<a href='#page_node_view' class='walkthrough_list_item_title'>" + node_value.title + "</a>"});
            $walkthrough_node_list.append($list_item);
          });
          // $("#walkthrough_node_list").listview("destroy").listview();
        }
      });
    }
    catch(error) {
      alert('walkthrough_list - ' + error);
    }*/
//    console.log('step list');
//  }
//}

/*$list_item.addEventListener('click', function() {
  step_list_generator.requestStep();
});*/