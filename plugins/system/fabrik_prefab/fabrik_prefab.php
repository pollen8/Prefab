<?php
/**
 * @package		Joomla
 * @subpackage fabrik
 * @copyright	Copyright (C) 2005 - 2011 Pollen 8 Design Ltd. All rights reserved.
 * @license		GNU/GPL, see LICENSE.php
 *
 * Adds overlay to forms to allow for drag and drop editiing of templates
 */

// no direct access
defined('_JEXEC') or die('Restricted access');

jimport( 'joomla.plugin.plugin');
jimport('joomla.filesystem.file');

/**
 * Joomla! Fabrik cron job plugin
 *
 * @author		Rob Clayburn <rob@pollen-8.co.uk>
 * @package		Joomla
 * @subpackage	fabrik
 */
class plgSystemFabrik_prefab extends JPlugin
{

	private $plugins = null;
	/**
	 * Constructor
	 *
	 * For php4 compatability we must not use the __constructor as a constructor for plugins
	 * because func_get_args ( void ) returns a copy of all passed arguments NOT references.
	 * This causes problems with cross-referencing necessary for the observer design pattern.
	 *
	 * @access	protected
	 * @param	object $subject The object to observe
	 * @param 	array  $config  An array that holds the plugin configuration
	 * @since	1.0
	 */

	function plgSystemFabrik_prefab(& $subject, $config)
	{
		parent::__construct($subject, $config);
	}


	function onAfterDispatch()
	{
		if (!$this->canUse())
		{
			//echo 'prefab not loaded';
			return;
		}
		$this->loadJs();
		JHTML::stylesheet('media/fabrik_prefab/css/prefab.css');
		JHTML::stylesheet('media/com_fabrik/css/window.css');
		$document = JFactory::getDocument();
		$opts = new stdClass();
		$opts->elementTemplates = $this->getElementTemplates();
		echo "<pre>";print_r($opts->elementTemplates);exit;
		$opts->plugins = $this->getPlugins();
		$opts->elements = $this->getElements();
		$opts = json_encode($opts);
		$id = JRequest::getCmd('view') . '_' . JRequest::getInt('formid');
		$script = "new Fabrik.Prefab('$id', ".$opts.");";
		$script .= "new Selector();";
		$document->addScriptDeclaration($script);
	}

	protected function loadJs()
	{
		JHTML::script('media/com_fabrik/js/icons.js');
		JHTML::script('media/com_fabrik/js/lib/art.js');
		JHTML::script('media/com_fabrik/js/icongen.js');
		JHTML::script('media/com_fabrik/js/fabrik.js');
		JHTML::script('media/com_fabrik/js/window.js');
		JHTML::script('media/fabrik_prefab/js/drag.group.js');
		JHTML::script('media/fabrik_prefab/js/Element.mouseInside.js');
		JHTML::script('media/fabrik_prefab/js/prefab.js');
	}
	
	protected function getElements()
	{
		$formId = JRequest::getInt('formid');
		$db = JFactory::getDbo();
		$query = $db->getQuery(true);
		$query->select('e.*')->from('#__fabrik_elements AS e')
		->join('LEFT', '#__fabrik_formgroup AS fg ON fg.group_id = e.group_id')->where('fg.form_id = ' . $formId);
		$db->setQuery($query);
		$rows = $db->loadObjectList();
		$return = array();
		foreach ($rows as $row)
		{
			if (!array_key_exists($row->plugin, $return))
			{
				 $return[$row->plugin] = array();
			}
			$return[$row->plugin][] = $row;
		}
		return $return;
	}

	/**
	 * get an array of installed plugins
	 * @return array
	 */

	protected function getPlugins()
	{
		if (!is_null($this->plugins))
		{
			return $this->plugins;
		}
		$db = JFactory::getDbo();
		$query = $db->getQuery(true);
		$query->select('extension_id AS id, REPLACE(name, "plg_fabrik_element_", "") AS label, name')->from('#__extensions')->where('enabled = 1 AND folder = "fabrik_element"');
		$db->setQuery($query);
		$this->plugins = $db->loadObjectList();
		return $this->plugins;
	}
	
	protected function getElementTemplates()
	{
		$pluginManager = new FabrikFEModelPluginmanager();
		//return $pluginManager->loadPlugInGroup('element');
		$plugins = $pluginManager->getPlugInGroupPlugins('element');
		$return = array();
		$data = array();
		foreach ($plugins as $plugin)
		{
			//force some settings so we render something visible
			$plugin->_editable = true;
			
			$params = $plugin->getParams();
			
			$subOpts = new stdClass();
			$subOpts->sub_options = new stdClass();
			$subOpts->sub_options->sub_values = array(1);
			$subOpts->sub_options->sub_labels = array('One');
			/* {"sub_options":{
			"sub_values":["1","2"],"sub_labels":["One","two"]} */
			$opts = $params->set('sub_options', $subOpts);
			//echo "<pre>";print_r($params);
			$return[str_replace('plgFabrik_Element', '', get_class($plugin))] = $plugin->render($data);
		}
		return $return;
		return $plugins[0]->render($data);
	}

	/**
	 * should the wysiwyg editor be loaded?
	 * @return	bool
	 */

	protected function canUse()
	{
		$app = JFactory::getApplication();
		$user = JFactory::getUser();
		if ($app->isAdmin())
		{
			return false;
		}
		//@TODO no longer correct
		/* if ($user->get('gid') < 25)
		{
			return false;
		} */
		if (JRequest::getCmd('option') != 'com_fabrik')
		{
			return false;
		}
		$view = JRequest::getCmd('view');
		if ($view !== 'form' && $view !== 'details')
		{
			return false;
		}
		return true;
	}

}