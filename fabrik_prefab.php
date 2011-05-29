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
		if (!$this->canUse()) {
			//echo 'prefab not loaded';
			return;
		}
		$this->loadJs();
		JHTML::stylesheet('prefab.css', 'plugins/system/fabrik_prefab/');
		JHTML::stylesheet('window.css', 'media/com_fabrik/css/');
		$document =& JFactory::getDocument();
		$opts = new stdClass();
		$opts->plugins = $this->getPlugins();
		$opts = json_encode($opts);
		$id = JRequest::getCmd('view') . '_' . JRequest::getInt('fabrik');
		$script = "new Fabrik.Prefab('$id', ".$opts.");";
		$script .= "new Selector();";
		$document->addScriptDeclaration($script);
	}

	protected function loadJs()
	{
		JHTML::script('art.js', 'media/com_fabrik/js/');
		JHTML::script('icons.js', 'media/com_fabrik/js/');
		JHTML::script('icongen.js', 'media/com_fabrik/js/');
		JHTML::script('fabrik.js', 'media/com_fabrik/js/');
		JHTML::script('window.js', 'media/com_fabrik/js/');
		JHTML::script('drag.group.js', 'plugins/system/fabrik_prefab/');
		JHTML::script('prefab.js', 'plugins/system/fabrik_prefab/');
	}

	/**
	 * get an array of installed plugins
	 * @return array
	 */

	protected function getPlugins()
	{
		$manager = new FabrikModelPluginmanager();
		$els = $manager->loadPlugInGroup('element');
		$output = array();
		foreach($els as $pname => $el){
			$el->_editable = true;
			$s = $el->render(array());
			$output[$el->_name] = $s;
		}
		$db =& JFactory::getDbo();
		$db->setQuery("SELECT `id`, `label`, `type`, `name` FROM #__fabrik_plugins WHERE `state` = 1 ORDER BY `type`");
		$rows = $db->loadObjectList();
		$return = array();
		foreach ($rows as $row) {
			if (!array_key_exists($row->type, $return)) {
				 $return[$row->type] = array();
			}
			//used when dropping element onto form
			$row->drop = $output[$row->name];
			$return[$row->type][] = $row;
		}
		return $return;
	}

	/**
	 * should the wysiwyg editor be loaded?
	 * @return bool
	 */

	protected function canUse()
	{
		$app =& JFactory::getApplication();
		$user =& JFactory::getUser();
		if ($app->isAdmin()) {
			return false;
		}
		if ($user->get('gid') < 25) {
			return false;
		}
		if (JRequest::getCmd('option') != 'com_fabrik') {
			return false;
		}
		$view = JRequest::getCmd('view');
		if ($view !== 'form' && $view !== 'details') {
			return false;
		}
		return true;
	}

}