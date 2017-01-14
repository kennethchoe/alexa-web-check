function Update-SourceVersion
{
  Param ([string]$Version)
  $NewVersion = 'AssemblyVersion("' + $Version + '")';
  $NewFileVersion = 'AssemblyFileVersion("' + $Version + '")';

  foreach ($o in $input) 
  {
    Write-output $o.FullName
    $TmpFile = $o.FullName + ".tmp"

     get-content $o.FullName | 
        %{$_ -replace 'AssemblyVersion\("[0-9]+(\.([0-9]+|\*)){1,3}"\)', $NewVersion } |
        %{$_ -replace 'AssemblyFileVersion\("[0-9]+(\.([0-9]+|\*)){1,3}"\)', $NewFileVersion }  > $TmpFile

     move-item $TmpFile $o.FullName -force
  }
}


function Update-AllAssemblyInfoFiles ( $version )
{
	$r= [System.Text.RegularExpressions.Regex]::Match($version, "^[0-9]+(\.[0-9]+){1,3}$");
	
	if (!$r.Success)
	{
		echo "Version number format is invalid."
		exit 1
	}
	
	foreach ($file in "AssemblyInfo.cs", "AssemblyInfo.vb" ) 
	{
		# recursively look only down to 3 levels. workaround to avoid error from node_modules depth.
		get-childitem -Recurse |? {$_.Name -eq $file} | Update-SourceVersion $version ;
	}
}
