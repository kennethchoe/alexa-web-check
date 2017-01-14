Import-Module WebAdministration -ErrorAction Ignore

function StartWebSite($webSiteName)
{
	$appPoolName = (Get-Item "IIS:\Sites\$webSiteName").applicationPool
	write-host "Starting web site $webSiteName..."
	Start-Website $webSiteName
	Start-WebAppPool $appPoolName
}

function StopWebSite($webSiteName)
{
	$appPoolName = (Get-Item "IIS:\Sites\$webSiteName").applicationPool
	StopWebAppPool $appPoolName 30
	StopWebSiteInternal $webSiteName 30
}

function StopWebAppPool($name, $timeout) {
    do {
		$state = (Get-WebAppPoolState $name).Value
		if ($state -eq "Stopped" -or $timeout -eq 0) {
			break
		}
		try {
			Stop-WebAppPool -Name $name
		} catch {
			write-warning $_
		}
		write-host "Stopping web app pool $name..."
		Start-Sleep -s 1
		$timeout = $timeout - 1
	} while ($true)
	
	if ($state -ne "Stopped") {
		throw "Cannot stop web app pool $name at this time."
	}
}

function StopWebSiteInternal($name, $timeout){
    do {
		$state = (Get-WebsiteState $name).Value
		if ($state -eq "Stopped" -or $timeout -eq 0) {
			break
		}
		try {
			Stop-Website -Name $name
		} catch {
			write-warning $_
		}
		write-host "Stopping web site $name..."
		Start-Sleep -s 1
		$timeout = $timeout - 1
	} while ($true)

	if ($state -ne "Stopped") {
		throw "Cannot stop web site $name at this time."
	}
}
