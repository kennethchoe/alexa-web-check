properties {
	$projectName = "Web"

    $version        = GetEnvOrDefault "PackageVersion" "1.0.0.0"   
	$webSite        = GetEnvOrDefault "webSite"        "Default Web Site/$projectName"
    $projectConfig  = GetEnvOrDefault "ProjectConfig"  "Release"
	
	$base_dir = resolve-path .\
	$source_dir = "$base_dir\src"
	$solutionPath = "$source_dir\$projectName.sln"
	$webProjectPath = "$source_dir\$projectName\$projectName.csproj"

	$zipCommand = "$base_dir\tools\7zip\7za.exe"	
	
    $nunitPath = "$source_dir\packages\NUnit.ConsoleRunner.3.5.0\tools"
	
	$build_dir = "$base_dir\build"
	$package_dir = "$build_dir\package"	
	$latestVersion_dir = "$build_dir\latestVersion"	
	
	$TestAssembly = "$source_dir\Tests\bin\$projectConfig\Tests.dll"
}

Framework "4.6"

dir psake-modules\*.psm1 | Import-Module

task default -depends Init, SetAssemblyInfo, Compile, Test
task ci -depends default, Package
task deploy -depends RunMsDeploy

task Init {
    delete_directory $build_dir
	create_directory $build_dir
}

task SetAssemblyInfo {
    Update-AllAssemblyInfoFiles $version
}

task Compile {
	exec { & "$base_dir\tools\nuget.exe" restore $solutionPath }
    exec { msbuild /t:clean /v:q /nologo /p:Configuration=$projectConfig $solutionPath }
    exec { msbuild /t:build /v:q /nologo /p:Configuration=$projectConfig $solutionPath }
}

task RunMsDeploy {
    exec { & msdeploy\$projectName.deploy.cmd /Y "-setParam:name='IIS Web Application Name',value='$webSite'" }
}

task Test {
	exec { & $nunitPath\nunit3-console.exe $TestAssembly --work=$build_dir }
}

task Package {
    delete_directory $package_dir
    create_directory $package_dir
    exec { & msbuild /t:package /v:q /nologo /p:"Configuration=$projectConfig;PackageLocation=$package_dir\msdeploy\$projectName.zip" $webProjectPath }
	exec { Copy-Item @("tools", "psake-modules", "default.ps1") "$package_dir\" -recurse }

    delete_directory $latestVersion_dir
    create_directory $latestVersion_dir
	exec { ZipDirectory $zipCommand $package_dir "$latestVersion_dir\latestPackage.zip" }
	exec { Copy-Item "$latestVersion_dir\latestPackage.zip" "$latestVersion_dir\$projectName $version.zip" }
}

function delete_directory($directory_name)
{
  rd $directory_name -recurse -force  -ErrorAction SilentlyContinue | out-null
}

function create_directory($directory_name)
{
  mkdir $directory_name  -ErrorAction SilentlyContinue  | out-null
}

function GetEnvOrDefault($name, $defaultValue)
{
	$value = (get-childitem -path Env: | where-object { $_.Name -eq $name }).Value
	if($value -ne $null) {
		return $value
	} else {
		return $defaultValue
	}
}